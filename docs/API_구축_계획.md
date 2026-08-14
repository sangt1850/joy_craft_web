# JoyCraft — API 레이어 구축 계획

> 모든 목 데이터를 실제 DB 테이블 기반 API로 교체하여 "테이블화 관리"를 달성하기 위한 전체 계획서.

---

## 현재 상태 (2026-08-11 기준) — Phase 0~5 전체 구현 완료

### 완료된 것

| 영역 | 상태 | 비고 |
|------|------|------|
| DB 스키마 (V1__init.sql) | ✅ 완성 | users, assets, component_types, component_type_versions, component_reviews, component_templates, sites, site_slides, site_publications, site_responses |
| DB 마이그레이션 V2 | ✅ 완성 | V2__add_login_id.sql — users 테이블에 login_id 컬럼 추가 |
| JPA 엔티티 | ✅ 완성 | User(loginId 추가), Site(update/softDelete/publish), SiteSlide(updateOverrides/updatePosition), SitePublication(revoke/incrementViewCount) |
| Repository | ✅ 완성 | 전체 커스텀 쿼리 추가 완료 |
| 글로벌 인프라 | ✅ 완성 | JwtProvider(UUID), JwtFilter(세션검증+SecurityContext), SecurityConfig(공개경로), SessionCacheService(UUID+preAuthTicket), ErrorCode(전체), GlobalExceptionHandler(404/403 처리), ApiResponse 래퍼 |
| 인증 레이어 | ✅ 완성 | AuthService, AuthController, 전체 Auth DTO |
| 사이트 레이어 | ✅ 완성 | SiteService(CRUD+슬라이드+발행), SiteController, PublicationController, 전체 Site DTO |
| 컴포넌트 레이어 | ✅ 완성 | ComponentService, ComponentController, TemplateListResponse |
| 관리자 레이어 | ✅ 완성 | AdminController, PlatformStatsResponse |
| 프론트엔드 API 클라이언트 | ✅ 완성 | client.ts, auth.ts, sites.ts, templates.ts, editor.ts, admin.ts |
| 프론트엔드 타입 | ✅ 완성 | src/types/api.ts |
| 프론트엔드 스토어 | ✅ 완성 | authStore.ts, siteStore.ts, editorStore.ts |
| AuthGuard 컴포넌트 | ✅ 완성 | src/components/auth/AuthGuard.tsx |
| App.tsx | ✅ 완성 | CustomerApp/MasterApp AuthGuard 래핑 |
| 페이지 API 연동 | ✅ 완성 | Dashboard, MySites, Browse, SiteEditor, MasterDashboard 목 데이터 제거 |

### 잔여 작업 (선택)

| 영역 | 상태 | 비고 |
|------|------|------|
| PlayerPage 슬라이드 렌더링 | 🔲 선택 | snapshot의 componentRef → registry 조회 후 실제 컴포넌트 렌더링 |
| SettingsPage | 🔲 선택 | `PUT /api/auth/me`, `PUT /api/auth/password` 구현 |
| PRO 구독 | 🔲 미래 | 구독 테이블 설계 후 AdminController proSubscribers 연동 |
| 결제 매출 | 🔲 미래 | 결제 테이블 설계 후 AdminController monthlyRevenue 연동 |

---

## Phase 0: 인프라 기반 (인증 + API 공통) ✅ 완료

### 백엔드 수정 내역

#### JwtProvider — ✅ 완료
`generateAccessToken(Long → UUID userId, String sessionId)`

#### SessionCacheService — ✅ 완료
`Cache<Long → UUID, String>` + preAuthTicket 캐시 (TTL 2분) 추가

```java
// 세션 관리
Optional<String> get(UUID userId)
void put(UUID userId, String sessionId)
void evict(UUID userId)

// preAuthTicket (TTL: session.pre-auth-ticket-ttl-minutes = 2분)
String createPreAuthTicket(UUID userId)
Optional<UUID> resolvePreAuthTicket(String ticket)
void expirePreAuthTicket(String ticket)
```

#### JwtFilter — ✅ 완료
- SKIP_PATHS: `/api/auth/login`, `/api/auth/register`, `/api/auth/force-login`, `/api/play/**`, `/api/templates/browse`, `/api/templates/categories`
- Claims → `UUID.fromString(claims.getSubject())` 파싱
- SessionCacheService로 세션 검증 (불일치 시 `SESSION_REPLACED` 예외)
- `UsernamePasswordAuthenticationToken`으로 SecurityContextHolder 설정

#### ErrorCode — ✅ 완료
```
추가됨:
  SITE_NOT_FOUND, TEMPLATE_NOT_FOUND, FORBIDDEN, SLIDE_NOT_FOUND, PUBLICATION_NOT_FOUND
```

#### SecurityConfig — ✅ 완료
```java
.requestMatchers("/api/play/**").permitAll()
.requestMatchers("/api/templates/browse").permitAll()
.requestMatchers("/api/templates/categories").permitAll()
```

#### GlobalExceptionHandler — ✅ 완료
- `SITE_NOT_FOUND`, `TEMPLATE_NOT_FOUND`, `SLIDE_NOT_FOUND`, `PUBLICATION_NOT_FOUND` → **404**
- `FORBIDDEN` → **403**
- 기타 `BusinessException` → **400**

#### ApiResponse 래퍼 DTO — ✅ 완료
```java
// global/dto/ApiResponse.java
public record ApiResponse<T>(T data) {
    public static <T> ApiResponse<T> of(T data) { ... }
}
```

#### User 엔티티 loginId 추가 — ✅ 완료
- `login_id TEXT UNIQUE NOT NULL` 컬럼 추가
- V2 마이그레이션: 기존 row는 `email@앞부분`으로 채움, email 컬럼 nullable로 변경

#### AuthService — ✅ 완료

**로그인 플로우:**
```
1. findByLoginId → 없으면 MEMBER_NOT_FOUND
2. BCrypt 비교 → 불일치 시 INVALID_CREDENTIALS
3. SessionCache 기존 세션 확인
   → 있으면: createPreAuthTicket → { alreadyLogin: true, preAuthTicket }
   → 없으면: 새 sessionId → 캐시 저장 → JWT 발급 → { accessToken }
```

**forceLogin 플로우:**
```
1. resolvePreAuthTicket → 없으면 TICKET_INVALID
2. expirePreAuthTicket + evict 기존 세션
3. 새 sessionId → JWT 발급 → { accessToken }
```

#### AuthController — ✅ 완료

| 엔드포인트 | 인증 | Request Body | Response |
|-----------|------|-------------|----------|
| `POST /api/auth/login` | 없음 | `{ loginId, password }` | `{ data: { accessToken } }` or `{ data: { alreadyLogin, preAuthTicket } }` |
| `POST /api/auth/force-login` | 없음 | `{ preAuthTicket }` | `{ data: { accessToken } }` |
| `POST /api/auth/register` | 없음 | `{ loginId, password, name, email?, phone?, marketingAgreed }` | `{ data: { accessToken } }` |
| `GET /api/auth/me` | Bearer | — | `{ data: { id, loginId, displayName, email, role, createdAt } }` |

### 프론트엔드 구현 내역

#### API 클라이언트 (`src/api/client.ts`) — ✅ 완료
- `localStorage.getItem("accessToken")` → `Authorization: Bearer ...` 자동 주입
- `401` 응답 시 토큰 삭제 + `/`로 리다이렉트
- `api.get / post / put / delete` 메서드

#### 인증 API (`src/api/auth.ts`) — ✅ 완료
`login`, `forceLogin`, `register`, `fetchMe`

#### 인증 스토어 (`src/store/authStore.ts`) — ✅ 완료
```typescript
interface AuthState {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  fetchMe(): Promise<void>     // 앱 초기화 시 호출
  setUser(user, token): void   // 로그인 성공 후 호출
  logout(): void
}
```

#### AuthGuard (`src/components/auth/AuthGuard.tsx`) — ✅ 완료
- `isLoading` 중 → `LOADING...` 스피너
- 미인증 → `/`로 리다이렉트
- `requiredRole` prop으로 MASTER 등 역할 체크

#### App.tsx — ✅ 완료
```tsx
<Route path="/master/*" element={<AuthGuard requiredRole="MASTER"><MasterApp /></AuthGuard>} />
<Route path="/*"         element={<AuthGuard><CustomerApp /></AuthGuard>} />
<Route path="/play/:slug" element={<PlayerPage />} />  {/* siteId → slug */}
```

---

## Phase 1: 내 사이트 (Dashboard + MySites) ✅ 완료

### 백엔드

#### SiteService — ✅ 완료
| 메서드 | 설명 |
|--------|------|
| `getMySites(UUID userId)` | deleted_at IS NULL, updatedAt 내림차순 |
| `getMyStats(UUID userId)` | 총 사이트·공개 사이트·하트·체험 남은 일수 |
| `createSite(UUID userId, CreateSiteRequest)` | 기본 theme={}, flowPolicy={mode:gated, showProgress:true, escapeAfter:120} |
| `deleteSite(UUID userId, UUID siteId)` | 소유권 확인 → `deletedAt = now()` soft delete |

#### SiteController — ✅ 완료
| 엔드포인트 | 응답 |
|-----------|------|
| `GET /api/sites` | `{ data: SiteListResponse[] }` |
| `GET /api/sites/stats` | `{ data: SiteStatsResponse }` |
| `POST /api/sites` | `201 { data: SiteDetailResponse }` |
| `DELETE /api/sites/{id}` | `204 No Content` |

#### Repository 추가 쿼리 — ✅ 완료
```java
// SiteRepository
long countByOwnerIdAndDeletedAtIsNull(UUID ownerId)
long countByOwnerIdAndStatusAndDeletedAtIsNull(UUID ownerId, SiteStatus status)
long countByDeletedAtIsNull()
long countByCreatedAtAfter(Instant since)

// SiteResponseRepository (JPQL)
@Query("SELECT COUNT(r) FROM SiteResponse r WHERE r.publication.site.owner.id = :ownerId AND r.publication.revokedAt IS NULL")
long countByPublicationSiteOwnerId(UUID ownerId)

// SiteSlideRepository
int countBySiteId(UUID siteId)
Optional<SiteSlide> findBySiteIdAndId(UUID siteId, UUID slideId)

// UserRepository
boolean existsByLoginId(String loginId)
boolean existsByEmail(String email)
long countByCreatedAtAfter(Instant since)
List<User> findTop10ByOrderByCreatedAtDesc()
```

### 프론트엔드

#### 사이트 API (`src/api/sites.ts`) — ✅ 완료
`fetchMySites`, `fetchMyStats`, `createSite`, `deleteSite`

#### 사이트 스토어 (`src/store/siteStore.ts`) — ✅ 완료
`sites`, `stats`, `isLoading`, `loadSites`, `loadStats`, `setSites`

#### DashboardPage.tsx — ✅ 완료
- STATS 상수 제거 → `siteStore.stats` 기반 동적 생성
- RECENT_SITES 제거 → `siteStore.sites.slice(0, 3)`
- 웰컴 배너: `authStore.user.displayName` 표시
- 새 사이트 → `createSite()` 호출 후 에디터 이동

#### MySitesPage.tsx — ✅ 완료
- SITES 상수 제거 → `siteStore.sites`
- 클라이언트 사이드 status 필터 유지 (DRAFT/PUBLISHED)
- 새 사이트 → `createSite()` 호출

### 목 데이터 → 실제 데이터 매핑

| 목 데이터 필드 | DB 테이블 | 컬럼/로직 |
|---------------|----------|----------|
| `STATS.내 사이트` | sites | `COUNT WHERE owner_id = ? AND deleted_at IS NULL` |
| `STATS.받은 하트` | site_responses | `COUNT WHERE publication.site.owner_id = ?` |
| `STATS.공개 사이트` | sites | `COUNT WHERE owner_id = ? AND status = 'PUBLISHED'` |
| `STATS.무료 체험` | users | `created_at + 14일 - now()` |
| `SITES[].pages` | site_slides | `COUNT WHERE site_id = ?` |
| `SITES[].status` | sites.status | DRAFT→"초안", PUBLISHED→"공개" |
| `SITES[].bg` | sites.status 기반 | SiteListResponse.from()에서 색상 매핑 |

---

## Phase 2: 템플릿 탐색 (BrowsePage) ✅ 완료

### 백엔드

#### ComponentService — ✅ 완료
| 메서드 | 설명 |
|--------|------|
| `getPublishedTemplates(String category)` | "전체" 또는 null이면 전체, 아니면 category 필터 |
| `getCategories()` | component_types에서 DISTINCT category |

#### ComponentController — ✅ 완료
| 엔드포인트 | 인증 | 응답 |
|-----------|------|------|
| `GET /api/templates/browse?category=` | 공개 | `{ data: TemplateListResponse[] }` |
| `GET /api/templates/categories` | 공개 | `{ data: string[] }` |

#### Repository 추가 쿼리 — ✅ 완료
```java
// ComponentTypeRepository
@Query("SELECT DISTINCT ct.category FROM ComponentType ct ORDER BY ct.category")
List<String> findDistinctCategories()

// ComponentTemplateRepository
@Query("""
    SELECT ct FROM ComponentTemplate ct
    JOIN FETCH ct.typeVersion tv JOIN FETCH tv.type t
    WHERE ct.status = 'PUBLISHED'
    AND (:category IS NULL OR t.category = :category)
    ORDER BY ct.publishedAt DESC
""")
List<ComponentTemplate> findPublishedByCategory(@Param("category") String category)
```

### 프론트엔드

#### 템플릿 API (`src/api/templates.ts`) — ✅ 완료
`fetchTemplates(category, search)`, `fetchCategories`

#### BrowsePage.tsx — ✅ 완료
- CATEGORIES 상수 제거 → `fetchCategories()` (앞에 "전체" 추가)
- TEMPLATES 상수 제거 → `fetchTemplates(category)` (카테고리 변경 시 재호출)
- emoji/bg는 인덱스 기반 고정값으로 대체 (DB에 별도 필드 없음)

### 목 데이터 → 실제 데이터 매핑

| 목 데이터 필드 | DB 테이블 | 처리 |
|---------------|----------|------|
| `TEMPLATES[].title` | component_templates.name | 그대로 |
| `TEMPLATES[].category` | component_types.category | JOIN |
| `TEMPLATES[].emoji` | — | 프론트에서 "🎨" 고정 |
| `TEMPLATES[].price` | component_type_versions.pricing | "free"→FREE, "premium"→PRO |
| `TEMPLATES[].bg` | — | 인덱스 % 6 색상 순환 |
| `CATEGORIES[]` | component_types.category | DISTINCT 조회 |

---

## Phase 3: 사이트 에디터 (SiteEditorPage) ✅ 완료

### 백엔드

#### SiteService 확장 — ✅ 완료
| 메서드 | 설명 |
|--------|------|
| `getSiteDetail(UUID userId, UUID siteId)` | Site + slides (SiteSlideRepository 별도 조회) |
| `updateSite(UUID userId, UUID siteId, UpdateSiteRequest)` | title/theme/flowPolicy null safe 업데이트 |
| `addSlide(UUID userId, UUID siteId, AddSlideRequest)` | position = countBySiteId (마지막+1) |
| `removeSlide(UUID userId, UUID siteId, UUID slideId)` | 삭제 후 나머지 position 0부터 재정렬 |
| `reorderSlides(UUID userId, UUID siteId, ReorderSlidesRequest)` | slideIds 순서대로 position 재할당 |
| `updateSlide(UUID userId, UUID siteId, UUID slideId, UpdateSlideRequest)` | overrides/escapeAfter null safe 업데이트 |
| `publish(UUID userId, UUID siteId)` | defaultValues + overrides 머지 → 스냅샷 → SitePublication 저장 |

#### SiteController 확장 — ✅ 완료
| 엔드포인트 | 응답 |
|-----------|------|
| `GET /api/sites/{id}` | `{ data: SiteDetailResponse }` |
| `PUT /api/sites/{id}` | `{ data: SiteDetailResponse }` |
| `POST /api/sites/{id}/slides` | `{ data: SiteDetailResponse }` |
| `DELETE /api/sites/{id}/slides/{slideId}` | `204 No Content` |
| `PUT /api/sites/{id}/slides/reorder` | `200` |
| `PUT /api/sites/{id}/slides/{slideId}` | `{ data: SlideResponse }` |
| `POST /api/sites/{id}/publish` | `{ data: PublishResponse }` |

#### PublicationController — ✅ 완료
| 엔드포인트 | 인증 | 설명 |
|-----------|------|------|
| `GET /api/play/{slug}` | 공개 | snapshot JSON 반환 + view_count++ |

**스냅샷 구조:**
```json
{
  "title": "승현이 생일",
  "theme": { ... },
  "flowPolicy": { "mode": "gated", "showProgress": true, "escapeAfter": 120 },
  "slides": [
    {
      "componentRef": "yes-no-qa",
      "schema": [...],
      "values": { "questionText": "나 좋아해?", "yesText": "응 ♥" }
    }
  ]
}
```
`values` = `defaultValues` + `overrides` 머지. 발행 후 원본 수정과 무관.

### 프론트엔드

#### 에디터 API (`src/api/editor.ts`) — ✅ 완료
`fetchSiteDetail`, `updateSite`, `addSlide`, `removeSlide`, `reorderSlides`, `updateSlide`, `publishSite`

#### 에디터 스토어 (`src/store/editorStore.ts`) — ✅ 완료
```typescript
interface EditorState {
  site: SiteDetailResponse | null
  selectedSlideId: string | null
  isDirty: boolean
  isSaving: boolean
  loadSite(id): Promise<void>
  selectSlide(id): void
  addSlide(templateId): Promise<void>
  removeSlide(slideId): Promise<void>
  reorderSlides(slideIds): Promise<void>
  updateSlideOverrides(slideId, overrides): void  // debounced 500ms 자동저장
  saveDraft(): Promise<void>
  updateTitle(title): void
}
```

#### SiteEditorPage.tsx — ✅ 완료
- DEFAULT_PAGES 제거 → `editorStore.site.slides`
- 편집 필드: `selectedSlide.overrides` + `selectedSlide.defaultValues` 머지 값 표시
- 저장 상태: `isDirty || isSaving` → "미저장/저장 중.../✓ 저장됨"
- siteId === "new" → `createSite()` 후 `/editor/{newId}` 리다이렉트
- "공유" 버튼 → `publishSite()` → 링크 클립보드 복사 + alert

### 목 데이터 → 실제 데이터 매핑

| 목 데이터 | DB 테이블 | 매핑 |
|----------|----------|------|
| `DEFAULT_PAGES[].name` | component_templates.name | `slide.templateName` |
| `questionText` | site_slides.overrides.questionText | JSONB |
| `yesText / noText` | site_slides.overrides.yesText/noText | JSONB |
| `yesColor` | site_slides.overrides.yesColor | JSONB |
| `dotBg` | site_slides.overrides.dotBg | JSONB |

---

## Phase 4: 게시 & 플레이어 ✅ 백엔드 완료 / 🔲 PlayerPage 렌더링 미구현

### 백엔드 — ✅ 완료
SiteService.publish + PublicationController가 Phase 3에 포함됨

### 프론트엔드

#### PlayerPage — 🔲 선택 미구현
현재: mock 렌더링 유지
향후:
- `/play/:slug` 파라미터로 `GET /api/play/{slug}` 호출
- 스냅샷의 `componentRef`로 `registry.resolveSlide()` → 실제 컴포넌트 렌더링
- `flowPolicy`에 따른 gated/free 페이지 전환

---

## Phase 5: 관리자 대시보드 ✅ 완료

### 백엔드

#### AdminController — ✅ 완료
| 엔드포인트 | 권한 확인 | 응답 |
|-----------|---------|------|
| `GET /api/admin/stats` | role == MASTER 확인, 아니면 FORBIDDEN | `{ data: PlatformStatsResponse }` |
| `GET /api/admin/users/recent` | role == MASTER 확인 | `{ data: UserResponse[] }` (최대 10명) |

```java
record PlatformStatsResponse(
    long totalUsers,       // COUNT(users)
    long totalSites,       // COUNT(sites WHERE deleted_at IS NULL)
    long todaySignups,     // COUNT(users WHERE created_at > 오늘 00:00 UTC)
    long todaySites,       // COUNT(sites WHERE created_at > 오늘 00:00 UTC)
    long proSubscribers,   // 0 (구독 테이블 미구현)
    String monthlyRevenue  // "₩0" (결제 테이블 미구현)
)
```

### 프론트엔드

#### 관리자 API (`src/api/admin.ts`) — ✅ 완료
`fetchPlatformStats`, `fetchRecentUsers`

#### MasterDashboardPage.tsx — ✅ 완료
- MASTER_STATS 상수 제거 → `fetchPlatformStats()`
- RECENT_USERS 상수 제거 → `fetchRecentUsers()`
- 날짜 헤더: `new Date().toISOString().slice(0, 10)` 동적 생성

### 목 데이터 → 실제 데이터 매핑

| 목 데이터 | DB | 로직 |
|----------|------|------|
| `전체 사용자` | users | `COUNT(*)` |
| `전체 사이트` | sites | `COUNT(*) WHERE deleted_at IS NULL` |
| `오늘 신규가입` | users | `COUNT(*) WHERE created_at > 오늘 00:00 UTC` |
| `오늘 생성 사이트` | sites | `COUNT(*) WHERE created_at > 오늘 00:00 UTC` |
| `PRO 구독자` | — | 0 (구독 테이블 미구현) |
| `이번 달 매출` | — | "₩0" (결제 테이블 미구현) |

---

## Phase 6: 랜딩 & 마무리

### LandingPage
정적 유지 (HOW_IT_WORKS, COMPONENTS, GALLERY 섹션 모두 마케팅 카피)

### SettingsPage — 🔲 선택 미구현
- 프로필 수정: `PUT /api/auth/me`
- 비밀번호 변경: `PUT /api/auth/password`
- 테마 설정: localStorage 기반 유지 (서버 저장 불필요)

---

## 파일 현황 (전체)

### 백엔드 신규 파일 (28개) — 전체 완료

| 파일 | 상태 |
|------|------|
| `global/dto/ApiResponse.java` | ✅ |
| `user/dto/LoginRequest.java` | ✅ |
| `user/dto/LoginResponse.java` | ✅ |
| `user/dto/ForceLoginRequest.java` | ✅ |
| `user/dto/RegisterRequest.java` | ✅ |
| `user/dto/UserResponse.java` | ✅ |
| `user/dto/PlatformStatsResponse.java` | ✅ |
| `user/service/AuthService.java` | ✅ |
| `user/controller/AuthController.java` | ✅ |
| `user/controller/AdminController.java` | ✅ |
| `site/dto/SiteListResponse.java` | ✅ |
| `site/dto/SiteStatsResponse.java` | ✅ |
| `site/dto/SiteDetailResponse.java` | ✅ |
| `site/dto/SlideResponse.java` | ✅ |
| `site/dto/CreateSiteRequest.java` | ✅ |
| `site/dto/UpdateSiteRequest.java` | ✅ |
| `site/dto/AddSlideRequest.java` | ✅ |
| `site/dto/ReorderSlidesRequest.java` | ✅ |
| `site/dto/UpdateSlideRequest.java` | ✅ |
| `site/dto/PublishResponse.java` | ✅ |
| `site/service/SiteService.java` | ✅ |
| `site/controller/SiteController.java` | ✅ |
| `site/controller/PublicationController.java` | ✅ |
| `component/dto/TemplateListResponse.java` | ✅ |
| `component/service/ComponentService.java` | ✅ |
| `component/controller/ComponentController.java` | ✅ |

### 백엔드 수정 파일 — 전체 완료

| 파일 | 내용 |
|------|------|
| `global/jwt/JwtProvider.java` | Long → UUID |
| `global/jwt/JwtFilter.java` | 세션 검증 + SecurityContext |
| `global/cache/SessionCacheService.java` | Long → UUID + preAuthTicket 캐시 |
| `global/exception/ErrorCode.java` | 5개 에러코드 추가 |
| `global/exception/GlobalExceptionHandler.java` | 404/403 상태코드 분기 |
| `global/security/SecurityConfig.java` | 공개 경로 3개 추가 |
| `user/entity/User.java` | loginId 필드 + Builder |
| `site/entity/Site.java` | update/softDelete/publish 메서드 |
| `site/entity/SiteSlide.java` | updateOverrides/updatePosition 메서드 |
| `site/entity/SitePublication.java` | revoke/incrementViewCount 메서드 |
| `user/repository/UserRepository.java` | existsByLoginId, existsByEmail, countByCreatedAtAfter, findTop10 |
| `site/repository/SiteRepository.java` | count 관련 쿼리 4개 |
| `site/repository/SiteResponseRepository.java` | JPQL countByOwner |
| `site/repository/SiteSlideRepository.java` | countBySiteId, findBySiteIdAndId |
| `component/repository/ComponentTypeRepository.java` | findDistinctCategories |
| `component/repository/ComponentTemplateRepository.java` | findPublishedByCategory |

### DB 마이그레이션

| 파일 | 상태 |
|------|------|
| `db/migration/V1__init.sql` | ✅ 기존 |
| `db/migration/V2__add_login_id.sql` | ✅ 신규 |

### 프론트엔드 신규 파일 (11개) — 전체 완료

| 파일 | 상태 |
|------|------|
| `src/types/api.ts` | ✅ |
| `src/api/client.ts` | ✅ |
| `src/api/auth.ts` | ✅ |
| `src/api/sites.ts` | ✅ |
| `src/api/templates.ts` | ✅ |
| `src/api/editor.ts` | ✅ |
| `src/api/admin.ts` | ✅ |
| `src/store/authStore.ts` | ✅ |
| `src/store/siteStore.ts` | ✅ |
| `src/store/editorStore.ts` | ✅ |
| `src/components/auth/AuthGuard.tsx` | ✅ |

### 프론트엔드 수정 파일 — 전체 완료

| 파일 | 내용 |
|------|------|
| `src/App.tsx` | AuthGuard 래핑, /play/:slug 라우트 |
| `src/pages/customer/DashboardPage.tsx` | 목 데이터 → API |
| `src/pages/customer/MySitesPage.tsx` | 목 데이터 → API |
| `src/pages/customer/BrowsePage.tsx` | 목 데이터 → API |
| `src/pages/editor/SiteEditorPage.tsx` | 목 데이터 → API + editorStore |
| `src/pages/master/MasterDashboardPage.tsx` | 목 데이터 → API |

---

## 검증 체크리스트

```
Phase 0 검증
  □ POST /api/auth/register → 200 { data: { accessToken } }
  □ POST /api/auth/login → 200 { data: { accessToken } }
  □ GET  /api/auth/me (Bearer 토큰) → 200 { data: UserResponse }
  □ GET  /api/sites (토큰 없음) → 401
  □ 이중 로그인 → { alreadyLogin: true, preAuthTicket } → force-login → 새 토큰

Phase 1 검증
  □ GET  /api/sites → 내 사이트 목록
  □ GET  /api/sites/stats → 통계
  □ POST /api/sites → 사이트 생성
  □ DELETE /api/sites/{id} → 소프트 삭제 확인

Phase 2 검증
  □ GET  /api/templates/browse → 공개 템플릿 (인증 없이)
  □ GET  /api/templates/categories → 카테고리 목록

Phase 3 검증
  □ GET  /api/sites/{id} → 슬라이드 포함 상세
  □ PUT  /api/sites/{id}/slides/{slideId} → overrides 저장
  □ POST /api/sites/{id}/publish → slug 반환

Phase 4 검증
  □ GET  /api/play/{slug} → 스냅샷 JSON 반환 + view_count 증가

Phase 5 검증
  □ GET  /api/admin/stats (MASTER 토큰) → 플랫폼 통계
  □ GET  /api/admin/stats (일반 토큰) → 403 FORBIDDEN
```
