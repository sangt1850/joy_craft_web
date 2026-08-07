# JoyCraft — API 레이어 구축 계획

> 모든 목 데이터를 실제 DB 테이블 기반 API로 교체하여 "테이블화 관리"를 달성하기 위한 전체 계획서.

---

## 현재 상태 진단

### 완료된 것

| 영역 | 상태 | 비고 |
|------|------|------|
| DB 스키마 (V1__init.sql) | 10개 테이블 완성 | users, assets, component_types, component_type_versions, component_reviews, component_templates, sites, site_slides, site_publications, site_responses |
| JPA 엔티티 | 9개 완성 | User, Asset, ComponentType, ComponentTypeVersion, ComponentReview, ComponentTemplate, Site, SiteSlide, SitePublication, SiteResponse |
| Repository | 10개 완성 | 기본 CRUD + 도메인별 커스텀 쿼리 |
| 글로벌 인프라 | 완성 | JwtProvider, JwtFilter, SecurityConfig, SessionCacheService, ErrorCode, GlobalExceptionHandler |
| 프론트엔드 UI | 18개 컴포넌트 + 7개 페이지 | NeoButton, NeoCard, SiteCard, TemplateCard 등 |
| 로그인/회원가입 UI | 완성 | LoginModal, RegisterModal (fetch 호출까지 구현) |

### 미구현 (이 계획의 범위)

| 영역 | 상태 | 비고 |
|------|------|------|
| Controller | 전무 | AuthController 포함 하나도 없음 |
| Service | 전무 | SessionCacheService만 있음 (인프라) |
| DTO | ErrorResponse만 존재 | 도메인 DTO 전무 |
| 프론트엔드 API 클라이언트 | 전무 | src/api/ 폴더 비어있음 |
| 프론트엔드 인증 상태 | 전무 | localStorage에 토큰만 저장, 글로벌 상태 없음 |

### 해결 필요한 리스크

| 리스크 | 설명 | 해결 시점 |
|--------|------|----------|
| JwtProvider Long→UUID | `generateAccessToken(Long userId, ...)` 인데 엔티티 ID는 UUID | Phase 0 |
| SessionCacheService Long→UUID | `Cache<Long, String>` 인데 User ID는 UUID | Phase 0 |
| AuthController 부재 | 프론트엔드가 `/api/auth/*` 호출하지만 백엔드에 없음 | Phase 0 |
| User 엔티티에 loginId 없음 | LoginModal이 `loginId`로 로그인하는데 User에는 `email`만 있음 | Phase 0에서 결정 |

---

## Phase 0: 인프라 기반 (인증 + API 공통)

> 모든 후속 Phase의 전제 조건. 여기서 인증 흐름이 end-to-end로 동작해야 한다.

### 0-1. 백엔드 수정 사항

#### JwtProvider 수정

```
파일: global/jwt/JwtProvider.java
변경: generateAccessToken(Long userId, ...) → generateAccessToken(UUID userId, ...)
```

**현재 코드:**
```java
public String generateAccessToken(Long userId, String sessionId) {
    return Jwts.builder()
            .subject(userId.toString())  // Long.toString()
            .claim("sid", sessionId)
            ...
}
```

**변경 후:**
```java
public String generateAccessToken(UUID userId, String sessionId) {
    return Jwts.builder()
            .subject(userId.toString())  // UUID.toString()
            .claim("sid", sessionId)
            ...
}
```

#### SessionCacheService 수정

```
파일: global/cache/SessionCacheService.java
변경: Cache<Long, String> → Cache<UUID, String>
      get/put/evict 파라미터 Long → UUID
```

#### JwtFilter 수정

```
파일: global/jwt/JwtFilter.java
변경:
  1. SKIP_PATHS에 "/api/auth/force-login", "/api/play/" 추가
  2. Claims에서 userId 추출 → SecurityContextHolder에 Authentication 설정
  3. TODO 주석 제거, 실제 세션 검증 로직 추가
```

**추가할 로직:**
```java
Claims claims = jwtProvider.parseAccessToken(token);
UUID userId = UUID.fromString(claims.getSubject());
String sessionId = claims.get("sid", String.class);

// 세션 검증 (다른 기기 로그인 감지)
sessionCacheService.get(userId).ifPresent(cachedSid -> {
    if (!cachedSid.equals(sessionId)) {
        throw new AuthException(ErrorCode.SESSION_REPLACED);
    }
});

// SecurityContext에 인증 정보 설정
UsernamePasswordAuthenticationToken auth =
    new UsernamePasswordAuthenticationToken(userId, null, List.of());
SecurityContextHolder.getContext().setAuthentication(auth);
```

#### ErrorCode 추가

```
파일: global/exception/ErrorCode.java
추가:
  SITE_NOT_FOUND("SITE_NOT_FOUND", "사이트를 찾을 수 없습니다."),
  TEMPLATE_NOT_FOUND("TEMPLATE_NOT_FOUND", "템플릿을 찾을 수 없습니다."),
  FORBIDDEN("FORBIDDEN", "접근 권한이 없습니다."),
  SLIDE_NOT_FOUND("SLIDE_NOT_FOUND", "슬라이드를 찾을 수 없습니다."),
  PUBLICATION_NOT_FOUND("PUBLICATION_NOT_FOUND", "게시물을 찾을 수 없습니다."),
```

#### SecurityConfig 수정

```
파일: global/security/SecurityConfig.java
변경: permitAll() 경로 추가
```

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/play/**").permitAll()              // 신규
    .requestMatchers("/api/templates/browse").permitAll()     // 신규
    .requestMatchers("/api/templates/categories").permitAll() // 신규
    .anyRequest().authenticated()
)
```

#### ApiResponse 래퍼 DTO 생성

```
파일: global/dto/ApiResponse.java (신규)
```

```java
public record ApiResponse<T>(T data) {
    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data);
    }
}
```

#### User 엔티티 loginId 필드 결정

프론트엔드 LoginModal은 `loginId`로 로그인하지만, User 엔티티에는 `email`만 있음.

**선택지:**
- A: User에 `loginId` 컬럼 추가 (V2 마이그레이션) → LoginModal 그대로 유지
- B: `email`을 loginId로 사용 → LoginModal의 필드명을 `email`로 변경

→ **권장: A안** (프론트엔드 RegisterModal에서 loginId와 email을 별도로 받고 있으므로)

**V2 마이그레이션 필요 시:**
```sql
-- V2__add_login_id.sql
ALTER TABLE users ADD COLUMN login_id text;
UPDATE users SET login_id = split_part(email, '@', 1);
ALTER TABLE users ALTER COLUMN login_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_login_id_uk UNIQUE (login_id);

-- email을 nullable로 변경 (선택적 입력이므로)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

#### AuthService 생성

```
파일: user/service/AuthService.java (신규)
```

| 메서드 | 설명 | 트랜잭션 |
|--------|------|----------|
| `login(LoginRequest)` | loginId+password 검증 → 기존 세션 확인 → 토큰 발급 or preAuthTicket 반환 | Read |
| `forceLogin(ForceLoginRequest)` | preAuthTicket 검증 → 기존 세션 무효화 → 새 토큰 발급 | Write |
| `register(RegisterRequest)` | 중복 체크 → User 생성 → 자동 로그인 토큰 반환 | Write |
| `getMe(UUID userId)` | 현재 로그인 유저 정보 조회 | Read |

**로그인 플로우:**
```
1. loginId로 User 조회 (없으면 MEMBER_NOT_FOUND)
2. password_hash BCrypt 비교 (불일치면 INVALID_CREDENTIALS)
3. SessionCacheService에서 기존 세션 확인
   → 있으면: { alreadyLogin: true, preAuthTicket: "..." } 반환
   → 없으면: 새 sessionId 생성 → 캐시 저장 → JWT 발급
4. preAuthTicket은 Caffeine 캐시에 TTL 2분으로 저장
```

#### AuthController 생성

```
파일: user/controller/AuthController.java (신규)
```

| 엔드포인트 | 메서드 | Request Body | Response |
|-----------|--------|-------------|----------|
| `POST /api/auth/login` | login | `{ loginId, password }` | `{ accessToken }` or `{ alreadyLogin, preAuthTicket }` |
| `POST /api/auth/force-login` | forceLogin | `{ preAuthTicket }` | `{ accessToken }` |
| `POST /api/auth/register` | register | `{ loginId, password, name, email?, phone?, marketingAgreed }` | `{ accessToken }` |
| `GET /api/auth/me` | getMe | - | `{ id, loginId, displayName, email, role, createdAt }` |

#### Auth DTO 생성

```
파일: user/dto/ (신규 4개)
```

**LoginRequest:**
```java
public record LoginRequest(
    @NotBlank String loginId,
    @NotBlank String password
) {}
```

**ForceLoginRequest:**
```java
public record ForceLoginRequest(
    @NotBlank String preAuthTicket
) {}
```

**RegisterRequest:**
```java
public record RegisterRequest(
    @NotBlank @Size(min = 4, max = 20) @Pattern(regexp = "^[a-zA-Z0-9_]+$") String loginId,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String name,
    @Email String email,
    String phone,
    boolean marketingAgreed
) {}
```

**UserResponse:**
```java
public record UserResponse(
    UUID id,
    String loginId,
    String displayName,
    String email,
    String role,
    Instant createdAt
) {
    public static UserResponse from(User user) { ... }
}
```

**LoginResponse:**
```java
public record LoginResponse(
    String accessToken,
    Boolean alreadyLogin,
    String preAuthTicket
) {
    public static LoginResponse token(String accessToken) { ... }
    public static LoginResponse conflict(String preAuthTicket) { ... }
}
```

### 0-2. 프론트엔드 신규 파일

#### API 클라이언트

```
파일: src/api/client.ts (신규)
```

```typescript
const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }

  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

#### 인증 스토어

```
파일: src/store/authStore.ts (신규)
```

```typescript
interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchMe: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { set({ isLoading: false }); return; }
    try {
      const res = await api.get<{ data: UserResponse }>("/auth/me");
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
  },
}));
```

#### AuthGuard 컴포넌트

```
파일: src/components/auth/AuthGuard.tsx (신규)
```

```typescript
// 인증 필요 라우트를 감싸는 가드
// isLoading 중에는 로딩 표시, 미인증이면 LandingPage로 리다이렉트
// requiredRole 프롭으로 MASTER 등 역할 체크 가능
```

#### API 응답 타입

```
파일: src/types/api.ts (신규)
```

```typescript
// 백엔드 응답에 대응하는 TypeScript 타입들
export interface UserResponse {
  id: string;
  loginId: string;
  displayName: string;
  email: string | null;
  role: "MASTER" | "CREATOR" | "CUSTOMER";
  createdAt: string;
}

export interface LoginResponse {
  accessToken?: string;
  alreadyLogin?: boolean;
  preAuthTicket?: string;
}

export interface ApiResponse<T> {
  data: T;
}
```

#### App.tsx 수정

```
파일: src/App.tsx
변경: CustomerApp과 MasterApp을 AuthGuard로 래핑
```

```tsx
// 변경 전
<Route path="/master/*" element={<MasterApp />} />
<Route path="/*" element={<CustomerApp />} />

// 변경 후
<Route path="/master/*" element={<AuthGuard requiredRole="MASTER"><MasterApp /></AuthGuard>} />
<Route path="/*" element={<AuthGuard><CustomerApp /></AuthGuard>} />
```

### 0-3. 검증 방법

1. 회원가입 → 로그인 → 토큰 발급 확인
2. `GET /api/auth/me` → 유저 정보 응답 확인
3. 토큰 없이 `GET /api/sites` 접근 → 401 확인
4. 프론트엔드: 비로그인 시 대시보드 접근 → 랜딩페이지로 리다이렉트 확인

---

## Phase 1: 내 사이트 (Dashboard + MySites)

> 사용자가 가장 먼저 보는 화면. 실제 사이트 데이터를 보여주는 첫 단계.

### 1-1. 백엔드

#### SiteService 생성

```
파일: site/service/SiteService.java (신규)
```

| 메서드 | 설명 |
|--------|------|
| `getMySites(UUID userId)` | `SiteRepository.findByOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc` → `List<SiteListResponse>` 변환 |
| `getMyStats(UUID userId)` | 집계 쿼리: 총 사이트 수, 공개 사이트 수, 받은 하트(response count), 체험 남은 일수 |
| `createSite(UUID userId, CreateSiteRequest)` | User 조회 → Site 엔티티 생성 (기본 theme/flowPolicy) → 저장 → SiteDetailResponse 반환 |
| `deleteSite(UUID userId, UUID siteId)` | 소유권 확인 → soft delete (deletedAt 설정) |

#### SiteController 생성

```
파일: site/controller/SiteController.java (신규)
```

| 엔드포인트 | 메서드 | 응답 |
|-----------|--------|------|
| `GET /api/sites` | getMySites | `ApiResponse<List<SiteListResponse>>` |
| `GET /api/sites/stats` | getMyStats | `ApiResponse<SiteStatsResponse>` |
| `POST /api/sites` | createSite | `ApiResponse<SiteDetailResponse>` |
| `DELETE /api/sites/{id}` | deleteSite | `204 No Content` |

#### Site DTO 생성

```
파일: site/dto/ (신규)
```

**SiteListResponse:**
```java
public record SiteListResponse(
    UUID id,
    String title,
    int slideCount,
    String status,       // "DRAFT" | "PUBLISHED"
    String bgColor,      // 첫 슬라이드 배경색 또는 기본값
    Instant updatedAt
) {
    public static SiteListResponse from(Site site) { ... }
}
```

**SiteStatsResponse:**
```java
public record SiteStatsResponse(
    long totalSites,
    long publishedSites,
    long totalHearts,     // site_responses 총 수
    int trialDaysLeft     // 체험 남은 일수 (하드코딩 or 별도 로직)
) {}
```

**CreateSiteRequest:**
```java
public record CreateSiteRequest(
    @NotBlank String title,
    String timezone       // 선택, 기본값 "Asia/Seoul"
) {}
```

#### SiteRepository 추가 쿼리

```java
// 기존
List<Site> findByOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc(UUID ownerId);

// 추가
long countByOwnerIdAndDeletedAtIsNull(UUID ownerId);
long countByOwnerIdAndStatusAndDeletedAtIsNull(UUID ownerId, SiteStatus status);
```

### 1-2. 프론트엔드

#### API 함수

```
파일: src/api/sites.ts (신규)
```

```typescript
export function fetchMySites(): Promise<SiteListResponse[]>
export function fetchMyStats(): Promise<SiteStatsResponse>
export function createSite(title: string): Promise<SiteDetailResponse>
export function deleteSite(id: string): Promise<void>
```

#### 사이트 스토어

```
파일: src/store/siteStore.ts (신규)
```

```typescript
interface SiteState {
  sites: SiteListResponse[];
  stats: SiteStatsResponse | null;
  isLoading: boolean;
  loadSites: () => Promise<void>;
  loadStats: () => Promise<void>;
}
```

#### 페이지 수정

**DashboardPage.tsx 변경:**
```
- STATS 상수 제거 → siteStore.stats에서 동적 생성
- RECENT_SITES 상수 제거 → siteStore.sites.slice(0, 3)
- 웰컴 배너: authStore.user.displayName 표시
- useEffect로 마운트 시 데이터 로드
- 로딩 상태 처리 (스켈레톤 or 로딩 인디케이터)
```

**MySitesPage.tsx 변경:**
```
- SITES 상수 제거 → siteStore.sites
- 필터 로직은 클라이언트 사이드 유지 (status 기반)
- "새 사이트" 버튼 → createSite() 호출 → 에디터 이동
```

### 1-3. 목 데이터 → 실제 데이터 매핑

| 목 데이터 필드 | DB 테이블 | 컬럼/로직 |
|---------------|----------|----------|
| `STATS.내 사이트 = "3"` | sites | `COUNT WHERE owner_id = ? AND deleted_at IS NULL` |
| `STATS.받은 하트 = "127"` | site_responses | `COUNT WHERE publication_id IN (owner's publications)` |
| `STATS.공개 사이트 = "2"` | sites | `COUNT WHERE owner_id = ? AND status = 'PUBLISHED'` |
| `STATS.무료 체험 = "D-12"` | users | `created_at + 14일 - now()` (or 별도 구독 테이블) |
| `SITES[].id` | sites.id | UUID |
| `SITES[].title` | sites.title | 그대로 |
| `SITES[].pages` | site_slides | `COUNT WHERE site_id = ?` |
| `SITES[].status` | sites.status | DRAFT→"초안", PUBLISHED→"공개" |
| `SITES[].bg` | sites.theme 또는 첫 슬라이드 | JSONB에서 추출 |

---

## Phase 2: 템플릿 탐색 (BrowsePage)

> 사용자가 사이트에 넣을 페이지를 고르는 화면.

### 2-1. 백엔드

#### ComponentService 생성

```
파일: component/service/ComponentService.java (신규)
```

| 메서드 | 설명 |
|--------|------|
| `getPublishedTemplates(String category, String search)` | PUBLISHED 템플릿 목록. category/search 필터 적용. component_types JOIN으로 category 접근 |
| `getCategories()` | component_types에서 DISTINCT category 조회 |

#### ComponentController 생성

```
파일: component/controller/ComponentController.java (신규)
```

| 엔드포인트 | 인증 | 응답 |
|-----------|------|------|
| `GET /api/templates/browse?category=&search=` | 공개 | `ApiResponse<List<TemplateListResponse>>` |
| `GET /api/templates/categories` | 공개 | `ApiResponse<List<String>>` |

#### Component DTO

**TemplateListResponse:**
```java
public record TemplateListResponse(
    UUID id,
    UUID groupId,
    String name,
    String description,
    String category,      // component_types.category
    String emoji,         // default_values에서 추출 or 별도 필드
    String pricing,       // "free" | "premium"
    String thumbnailUrl   // asset에서 URL 생성
) {}
```

#### Repository 추가

```java
// ComponentTypeRepository
@Query("SELECT DISTINCT ct.category FROM ComponentType ct ORDER BY ct.category")
List<String> findDistinctCategories();

// ComponentTemplateRepository — 카테고리 필터 포함 조회
@Query("""
    SELECT ct FROM ComponentTemplate ct
    JOIN ct.typeVersion tv
    JOIN tv.type t
    WHERE ct.status = 'PUBLISHED'
    AND (:category IS NULL OR t.category = :category)
    ORDER BY ct.publishedAt DESC
""")
List<ComponentTemplate> findPublishedByCategory(@Param("category") String category);
```

### 2-2. 프론트엔드

**BrowsePage.tsx 변경:**
```
- CATEGORIES 상수 제거 → API에서 로드 + "전체" 앞에 추가
- TEMPLATES 상수 제거 → API에서 로드
- 검색: 클라이언트 사이드 유지 (소량 데이터) 또는 API 파라미터
```

### 2-3. 목 데이터 → 실제 데이터 매핑

| 목 데이터 필드 | DB 테이블 | 컬럼/로직 |
|---------------|----------|----------|
| `TEMPLATES[].id` | component_templates.id | UUID |
| `TEMPLATES[].title` | component_templates.name | 그대로 |
| `TEMPLATES[].category` | component_types.category | JOIN으로 접근 |
| `TEMPLATES[].emoji` | component_templates.default_values | JSONB에서 emoji 키 추출 (또는 별도 필드 추가) |
| `TEMPLATES[].price` | component_type_versions.pricing | "free"→"FREE", "premium"→"PRO" |
| `TEMPLATES[].bg` | component_templates.default_values | JSONB에서 bgColor 키 추출 (또는 기본값) |
| `CATEGORIES[]` | component_types.category | DISTINCT 조회 |

---

## Phase 3: 사이트 에디터 (SiteEditorPage)

> 가장 복잡한 단계. 슬라이드 CRUD + 실시간 편집 + 자동저장.

### 3-1. 백엔드

#### SiteService 확장

```
파일: site/service/SiteService.java (기존 확장)
```

| 메서드 | 설명 |
|--------|------|
| `getSiteDetail(UUID userId, UUID siteId)` | Site + slides (JOIN FETCH) + 각 slide의 template/schema 정보 포함 |
| `updateSite(UUID userId, UUID siteId, UpdateSiteRequest)` | 소유권 확인 → title/theme/flowPolicy 업데이트 |
| `addSlide(UUID userId, UUID siteId, AddSlideRequest)` | 소유권 확인 → 템플릿 조회 → SiteSlide 생성 (position = 마지막+1) |
| `removeSlide(UUID userId, UUID siteId, UUID slideId)` | 소유권 확인 → 삭제 → 나머지 position 재정렬 |
| `reorderSlides(UUID userId, UUID siteId, List<UUID> slideIds)` | DEFERRABLE 제약조건 활용하여 position 일괄 업데이트 |
| `updateSlide(UUID userId, UUID slideId, UpdateSlideRequest)` | 소유권 확인 → overrides JSONB 업데이트 |

#### SiteController 확장

```
파일: site/controller/SiteController.java (기존 확장)
```

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `GET /api/sites/{id}` | getSiteDetail | 사이트 상세 (슬라이드 포함) |
| `PUT /api/sites/{id}` | updateSite | 사이트 메타데이터 수정 |
| `POST /api/sites/{id}/slides` | addSlide | 슬라이드 추가 |
| `DELETE /api/sites/{id}/slides/{slideId}` | removeSlide | 슬라이드 삭제 |
| `PUT /api/sites/{id}/slides/reorder` | reorderSlides | 슬라이드 순서 변경 |
| `PUT /api/sites/{id}/slides/{slideId}` | updateSlide | 슬라이드 overrides 수정 |

#### 에디터 DTO

**SiteDetailResponse:**
```java
public record SiteDetailResponse(
    UUID id,
    String title,
    JsonNode theme,
    JsonNode background,
    JsonNode flowPolicy,
    String timezone,
    String status,
    List<SlideResponse> slides,
    Instant updatedAt
) {}
```

**SlideResponse:**
```java
public record SlideResponse(
    UUID id,
    int position,
    UUID templateId,
    String templateName,
    String componentRef,     // component_types.slug
    JsonNode schema,         // component_type_versions.schema
    JsonNode defaultValues,  // component_templates.default_values
    JsonNode overrides,      // site_slides.overrides
    Integer escapeAfter
) {}
```

**UpdateSiteRequest:**
```java
public record UpdateSiteRequest(
    String title,
    JsonNode theme,
    JsonNode flowPolicy
) {}
```

**AddSlideRequest:**
```java
public record AddSlideRequest(
    @NotNull UUID templateId,
    JsonNode overrides      // 선택, 기본값 {}
) {}
```

**ReorderSlidesRequest:**
```java
public record ReorderSlidesRequest(
    @NotNull List<UUID> slideIds  // 새 순서대로 정렬된 ID 목록
) {}
```

**UpdateSlideRequest:**
```java
public record UpdateSlideRequest(
    JsonNode overrides,
    Integer escapeAfter
) {}
```

### 3-2. 프론트엔드

#### 에디터 스토어

```
파일: src/store/editorStore.ts (신규)
```

```typescript
interface EditorState {
  site: SiteDetailResponse | null;
  selectedSlideId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  loadSite: (id: string) => Promise<void>;
  updateSite: (updates: Partial<UpdateSiteRequest>) => void;
  addSlide: (templateId: string) => Promise<void>;
  removeSlide: (slideId: string) => Promise<void>;
  reorderSlides: (slideIds: string[]) => Promise<void>;
  updateSlideOverrides: (slideId: string, overrides: Record<string, unknown>) => void;
  saveDraft: () => Promise<void>;  // debounced 500ms
}
```

#### SiteEditorPage.tsx 변경

```
- DEFAULT_PAGES 제거 → editorStore.site.slides
- 하드코딩된 편집 필드 제거 → 선택된 슬라이드의 schema에서 동적 생성
- "저장됨/저장 중..." → editorStore.isSaving
- 페이지 추가 → 템플릿 선택 모달 → addSlide(templateId)
- siteId === "new" → createSite() 호출 → /editor/{newId}로 리다이렉트
- 자동저장: overrides 변경 시 debounced saveDraft() 호출
```

**동적 필드 렌더링 로직:**
```typescript
// schema 예시: [{ key: "questionText", label: "질문", field: { kind: "string" } }]
// 현재 값: overrides[key] ?? defaultValues[key]

function renderField(field: SchemaField, value: unknown, onChange: (v: unknown) => void) {
  switch (field.field.kind) {
    case "string": return <input value={value} onChange={...} />;
    case "color":  return <ColorPicker value={value} onChange={...} />;
    case "number": return <input type="range" min={field.field.min} max={field.field.max} />;
    case "font":   return <select>...</select>;
    case "image":  return <ImageUploader />;
  }
}
```

### 3-3. 목 데이터 → 실제 데이터 매핑

| 목 데이터 | DB 테이블 | 매핑 |
|----------|----------|------|
| `DEFAULT_PAGES[].id` | site_slides.id | UUID |
| `DEFAULT_PAGES[].name` | component_templates.name | template에서 가져옴 |
| `DEFAULT_PAGES[].colorIdx` | site_slides.overrides | JSONB에서 추출 or 위치 기반 |
| `questionText` | site_slides.overrides.questionText | JSONB 필드 |
| `yesText` | site_slides.overrides.yesText | JSONB 필드 |
| `noText` | site_slides.overrides.noText | JSONB 필드 |
| `yesColor` | site_slides.overrides.yesColor | JSONB 필드 |
| `dotBg` | site_slides.overrides.dotBg | JSONB 필드 |

---

## Phase 4: 게시 & 플레이어

> 완성된 사이트를 링크로 공유하고 방문자가 볼 수 있게 하는 단계.

### 4-1. 백엔드

#### PublicationService 생성

```
파일: site/service/PublicationService.java (신규)
```

| 메서드 | 설명 |
|--------|------|
| `publish(UUID userId, UUID siteId)` | 소유권 확인 → 사이트+슬라이드 전체를 JSON 스냅샷으로 구움 → slug 생성 (nanoid 8자) → SitePublication 생성 |
| `getBySlug(String slug)` | 공개 조회. revoked_at IS NULL, expires_at 체크, view_count++ |
| `revoke(UUID userId, UUID publicationId)` | 소유권 확인 → revoked_at 설정 |

**스냅샷 구조:**
```json
{
  "title": "승현이 생일",
  "theme": { "fontFamily": "...", "accentColor": "..." },
  "flowPolicy": { "mode": "gated", "showProgress": true, "escapeAfter": 120 },
  "slides": [
    {
      "componentRef": "yes-no-qa",
      "schema": [...],
      "values": { "questionText": "나 좋아해?", "yesText": "응 ♥", ... }
    }
  ]
}
```

`values`는 `defaultValues`에 `overrides`를 머지한 최종 값. 스냅샷은 불변이므로 원본 사이트가 수정돼도 이미 발행된 링크는 영향 없음.

#### PublicationController 생성

```
파일: site/controller/PublicationController.java (신규)
```

| 엔드포인트 | 인증 | 응답 |
|-----------|------|------|
| `POST /api/sites/{id}/publish` | 필요 | `ApiResponse<PublishResponse>` |
| `GET /api/play/{slug}` | 공개 | 스냅샷 JSON |
| `DELETE /api/publications/{id}` | 필요 | `204 No Content` |

#### Publication DTO

**PublishResponse:**
```java
public record PublishResponse(
    UUID id,
    String slug,
    String url,          // "/play/{slug}"
    Instant publishedAt
) {}
```

### 4-2. 프론트엔드

**SiteEditorPage 수정:**
```
- "공유" 버튼 클릭 → POST /api/sites/{id}/publish → 링크 복사 모달 표시
- 모달: slug URL + 복사 버튼 + QR 코드 (선택)
```

**PlayerPage 수정:**
```
- useParams().siteId → slug로 변경 (라우트: /play/:slug)
- GET /api/play/{slug} → 스냅샷 로드
- slides 배열 순회하며 componentRef로 registry.resolveSlide() → 컴포넌트 렌더링
- flowPolicy에 따른 페이지 전환 로직 (gated/free)
```

---

## Phase 5: 관리자 대시보드

> MASTER 역할 전용 화면. 플랫폼 전체 통계 + 최근 가입자.

### 5-1. 백엔드

#### AdminController 생성

```
파일: user/controller/AdminController.java (신규)
```

| 엔드포인트 | 권한 | 응답 |
|-----------|------|------|
| `GET /api/admin/stats` | MASTER | `ApiResponse<PlatformStatsResponse>` |
| `GET /api/admin/users/recent?limit=10` | MASTER | `ApiResponse<List<UserResponse>>` |

**권한 체크:**
```java
// SecurityContext에서 userId 추출 → User 조회 → role == MASTER 확인
// 아니면 ErrorCode.FORBIDDEN 예외
```

#### PlatformStatsResponse

```java
public record PlatformStatsResponse(
    long totalUsers,
    long totalSites,
    long todaySignups,        // users WHERE created_at > today 00:00
    long todaySites,          // sites WHERE created_at > today 00:00
    long proSubscribers,      // 별도 구독 테이블 or 하드코딩 (미구현)
    String monthlyRevenue     // 별도 결제 테이블 or 하드코딩 (미구현)
) {}
```

#### UserRepository 추가 쿼리

```java
long countByCreatedAtAfter(Instant since);
List<User> findTop10ByOrderByCreatedAtDesc();
```

#### SiteRepository 추가 쿼리

```java
long countByCreatedAtAfter(Instant since);
```

### 5-2. 프론트엔드

**MasterDashboardPage.tsx 변경:**
```
- MASTER_STATS 상수 제거 → API에서 로드 → StatCard 배열로 변환
- RECENT_USERS 상수 제거 → API에서 로드
- 날짜 헤더: new Date().toISOString().slice(0, 10) 사용
```

### 5-3. 목 데이터 → 실제 데이터 매핑

| 목 데이터 | DB | 로직 |
|----------|------|------|
| `전체 사용자 = "1,284"` | users | `COUNT(*)` |
| `전체 사이트 = "4,712"` | sites | `COUNT(*) WHERE deleted_at IS NULL` |
| `오늘 신규가입 = "38"` | users | `COUNT(*) WHERE created_at > today` |
| `오늘 생성 사이트 = "152"` | sites | `COUNT(*) WHERE created_at > today` |
| `PRO 구독자 = "247"` | - | 구독 테이블 미구현 → 0 또는 하드코딩 |
| `이번 달 매출 = "₩2.4M"` | - | 결제 테이블 미구현 → "₩0" 또는 하드코딩 |

---

## Phase 6: 랜딩 & 마무리

### LandingPage

| 섹션 | 처리 |
|------|------|
| HOW_IT_WORKS (3 스텝) | 정적 유지 (마케팅 카피) |
| COMPONENTS (5개) | 선택: `GET /api/templates/featured?limit=5` 또는 정적 유지 |
| GALLERY (3개) | 선택: `GET /api/sites/gallery?limit=3` (featured 플래그 필요) 또는 정적 유지 |

### SettingsPage

현재 "준비 중" 상태 유지. 추후 구현 시:
- 프로필 수정: `PUT /api/auth/me`
- 비밀번호 변경: `PUT /api/auth/password`
- 테마 설정: 현재 localStorage 기반 유지 (서버 저장 불필요)

---

## 파일 생성/수정 종합

### 백엔드 신규 파일 (14개)

```
user/controller/AuthController.java
user/controller/AdminController.java
user/service/AuthService.java
user/service/UserService.java
user/dto/LoginRequest.java
user/dto/LoginResponse.java
user/dto/ForceLoginRequest.java
user/dto/RegisterRequest.java
user/dto/UserResponse.java
user/dto/PlatformStatsResponse.java
site/controller/SiteController.java
site/controller/PublicationController.java
site/service/SiteService.java
site/service/PublicationService.java
site/dto/SiteListResponse.java
site/dto/SiteStatsResponse.java
site/dto/SiteDetailResponse.java
site/dto/SlideResponse.java
site/dto/CreateSiteRequest.java
site/dto/UpdateSiteRequest.java
site/dto/AddSlideRequest.java
site/dto/ReorderSlidesRequest.java
site/dto/UpdateSlideRequest.java
site/dto/PublishResponse.java
component/controller/ComponentController.java
component/service/ComponentService.java
component/dto/TemplateListResponse.java
global/dto/ApiResponse.java
```

### 백엔드 수정 파일 (6개)

```
global/jwt/JwtProvider.java          — Long→UUID
global/jwt/JwtFilter.java            — 세션 검증 + SecurityContext 설정
global/cache/SessionCacheService.java — Long→UUID
global/exception/ErrorCode.java       — 에러코드 추가
global/security/SecurityConfig.java   — 공개 경로 추가
user/repository/UserRepository.java   — 쿼리 추가
site/repository/SiteRepository.java   — 쿼리 추가
component/repository/ComponentTypeRepository.java  — 쿼리 추가
component/repository/ComponentTemplateRepository.java — 쿼리 추가
```

### 백엔드 마이그레이션 (선택)

```
db/migration/V2__add_login_id.sql    — loginId 컬럼 추가 (선택)
```

### 프론트엔드 신규 파일 (7개)

```
src/api/client.ts
src/api/sites.ts
src/api/templates.ts
src/api/editor.ts
src/api/admin.ts
src/store/authStore.ts
src/store/siteStore.ts
src/store/editorStore.ts
src/types/api.ts
src/components/auth/AuthGuard.tsx
```

### 프론트엔드 수정 파일 (6개)

```
src/App.tsx                              — AuthGuard 래핑
src/pages/customer/DashboardPage.tsx     — 목데이터 → API
src/pages/customer/MySitesPage.tsx       — 목데이터 → API
src/pages/customer/BrowsePage.tsx        — 목데이터 → API
src/pages/editor/SiteEditorPage.tsx      — 목데이터 → API + 동적 편집
src/pages/master/MasterDashboardPage.tsx — 목데이터 → API
```

---

## 구현 순서 요약

```
Phase 0 (인프라)      ← 모든 Phase의 전제
  ↓
Phase 1 (내 사이트)    ← 사용자가 가장 먼저 보는 화면
  ↓
Phase 2 (템플릿 탐색)  ← Phase 1과 독립, 병렬 가능
  ↓
Phase 3 (에디터)       ← Phase 1의 사이트 CRUD 기반
  ↓
Phase 4 (게시/플레이어) ← Phase 3의 에디터 기반
  ↓
Phase 5 (관리자)       ← Phase 0만 있으면 독립 구현 가능
  ↓
Phase 6 (마무리)       ← 선택적
```

Phase 2와 Phase 5는 Phase 0 완료 후 언제든 독립적으로 구현 가능.
