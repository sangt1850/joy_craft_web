# JoyCraft 전체 코드 점검 보고서

- **점검일**: 2026-08-17
- **대상**: `joy_craft_web` (Frontend) / `joy_craft_api` (Backend)
- **범위**: 빌드·테스트·정적분석 실행 + 프론트/백엔드 전 소스 정독 + FE↔BE 계약 대조

---

## 1. 검증 실행 결과

| 항목 | 명령 | 결과 |
|------|------|------|
| FE 타입체크 | `npx tsc -b` | ✅ 에러 0 |
| FE 단위 테스트 | `npx vitest run` | ✅ 3파일 **159/159 통과** |
| FE 린트 | `npx oxlint` | ✅ 에러 0 / 경고 2 |
| FE 프로덕션 빌드 | `npx vite build` | ✅ 성공 (2325 모듈) |
| BE 컴파일 | `gradlew compileJava` | ✅ 성공 |
| BE 테스트 | `gradlew build` | ⚠️ **9개 중 8통과 / 1실패** |

### FE↔BE 계약 대조

- 프론트가 호출하는 API 경로 **23개 전부** 백엔드 매핑에 존재 ✅
- 슬라이드 컴포넌트 slug: 백엔드 시드(`V7__seed_builtin_components.sql`) 18종 ↔ 프론트 레지스트리(`registerSlide`) 18종 **완전 일치** ✅
- `/api/play/{slug}`만 `ApiResponse<T>` 봉투가 없는 예외 — 프론트가 이미 인지하고 `publicApi`로 분리 처리 ✅

### 환경 이슈 (코드 문제 아님)

1. **`JAVA_HOME` 미설정** — Bash 환경에서 `gradlew`가 즉시 종료된다.
   해결: `JAVA_HOME=C:\Users\dltkd\.jdks\corretto-21.0.9`
2. **로컬 PostgreSQL 미기동** — 5432 포트 닫힘, 서비스 미설치, Docker 없음.
   `JoycraftApiApplicationTests.contextLoads()`가 Hibernate dialect 결정 실패로 깨진다.
   → 이 때문에 **백엔드 실기동 E2E 테스트는 수행하지 못했다.** 아래 백엔드 지적은 전부 코드 정독 기반이다.

---

## 2. 발견된 문제 (15건)

심각도 순. 번호는 수정 순서와 동일하다.

### 🔴 높음

#### 1. 카카오 OAuth `state` 파라미터 누락 (CSRF)

- **위치**: `joy_craft_api` `KakaoOAuthService.getAuthorizationUrl()`
- **내용**: 인가 URL에 `client_id` / `redirect_uri` / `response_type`만 붙는다. OAuth 표준 CSRF 방어인 `state`가 없다.
- **영향**: 공격자가 자기 인가 코드로 콜백 URL을 만들어 피해자에게 열게 하면, 피해자 브라우저가 **공격자 계정으로 로그인**된다. 이후 피해자가 만든 사이트/데이터가 공격자 계정에 쌓인다.

#### 2. `RestTemplate` 타임아웃 미설정

- **위치**: `joy_craft_api` `KakaoOAuthService` — `new RestTemplate()`
- **내용**: 기본 `SimpleClientHttpRequestFactory`는 connect/read 타임아웃이 무한이다.
- **영향**: 카카오 API가 응답하지 않으면 톰캣 워커 스레드가 무한 점유된다. 로그인 시도가 몰리면 전체 API가 마비된다.

#### 3. 강제 로그아웃이 5분만 유효 (세션 무효화 우회)

- **위치**: `joy_craft_api` `SessionCacheService` + `JwtFilter`
- **내용**: `session.cache-ttl-minutes: 5`인데 JWT 수명은 30분이다. `JwtFilter`는
  `sessionCacheService.get(userId).ifPresent(...)` 로 **캐시에 값이 있을 때만** sid를 대조한다.
- **영향**:
  - 로그인 5분 뒤 캐시 엔트리가 만료되면 sid 검사가 통째로 건너뛰어진다.
  - force-login으로 쫓아낸 기기의 옛 토큰이 **5분 후 다시 유효해진다.**
  - 같은 이유로 "다른 기기 로그인 감지" 기능도 로그인 직후 5분간만 동작한다.
- **부수 문제**: 서버측 로그아웃 엔드포인트가 없다. 프론트는 `localStorage`만 비우고 JWT는 만료까지 살아 있다.

#### 4. 발행 slug 충돌 시 500

- **위치**: `joy_craft_api` `SiteService.publish()`
- **내용**: `UUID.randomUUID()`를 8자(32bit)로 잘라 slug로 쓴다. DB는 `site_publications.slug text NOT NULL UNIQUE`이고 재시도 로직이 없다.
- **영향**: 충돌하면 `DataIntegrityViolationException` → `GlobalExceptionHandler.handleUnexpected` → `500`. 사용자에겐 원인 불명 오류로 보인다.

### 🟡 중간

#### 5. `reorderSlides` 입력 검증 없음

- **위치**: `joy_craft_api` `SiteService.reorderSlides()` / `ReorderSlidesRequest`
- **내용**: `@NotNull List<UUID>`만 검사한다. 사이트의 전체 슬라이드 집합과 일치하는지(순열인지) 확인하지 않고, 모르는 id는 조용히 무시한다.
- **영향**: 일부만 담아 보내면 나머지 슬라이드가 옛 position을 유지해 값이 중복되고,
  `site_slides_pos_uk UNIQUE (site_id, position) DEFERRABLE` 위반으로 커밋 시점에 500이 난다.
- **참고**: 프론트는 `reordered.length !== site.slides.length` 가드로 막고 있으나, API 자체는 무방비다.

#### 6. `publish()`가 이전 발행본을 폐기하지 않음

- **위치**: `joy_craft_api` `SiteService.publish()`
- **내용**: 발행할 때마다 새 slug의 `SitePublication`을 만든다. `SitePublication.revoke()`는 **코드 전체에서 한 번도 호출되지 않는다.**
- **영향**: 이미 공유한 옛 링크가 옛 스냅샷을 영구히 서빙한다. 사용자는 "수정했는데 왜 그대로냐"를 겪고, 잘못 공개한 내용을 회수할 방법이 없다.

#### 7. 인증 누락 시 403 응답 / 프론트는 401만 처리

- **위치**: `joy_craft_api` `SecurityConfig` + `joy_craft_web` `src/api/client.ts`
- **내용**: `SecurityConfig`에 `exceptionHandling` 설정이 없다. Spring Security 7.1.0의 기본 EntryPoint는
  `Http403ForbiddenEntryPoint`다(의존성 jar에서 확인). 따라서 **Authorization 헤더가 없는 요청은 403**을 받는다.
  반면 `JwtFilter`가 직접 거부하는 만료/위조 토큰은 401이다.
- **영향**: `client.ts`는 401에서만 토큰을 비우고 `/`로 보낸다. 403 경로에서는 세션 정리가 안 돼 깨진 상태로 남는다.

#### 8. 계정 존재 여부 열거 가능

- **위치**: `joy_craft_api` `AuthService.login()`
- **내용**: 아이디가 없으면 `MEMBER_NOT_FOUND`, 비밀번호가 틀리면 `INVALID_CREDENTIALS`로 **다른 에러**를 준다.
- **영향**: 공격자가 가입된 아이디 목록을 수집할 수 있다.

#### 9. 공개 조회마다 DB 쓰기 + 조회수 유실

- **위치**: `joy_craft_api` `PublicationController.getBySlug()`
- **내용**: GET 요청마다 `incrementViewCount()` 후 `save()`. 애플리케이션 레벨 read-modify-write다.
- **영향**:
  - 동시 조회 시 카운트가 덮어써져 유실된다(lost update).
  - 인증이 필요 없는 공개 엔드포인트에서 무제한 UPDATE가 발생한다.

#### 10. 발행 만료/비밀번호 기능 미구현

- **위치**: `joy_craft_api` `SitePublication` / `SitePublicationRepository`
- **내용**: `expiresAt`, `passwordHash` 필드와 DB 컬럼이 있으나 조회는 `findBySlugAndRevokedAtIsNull`뿐이다.
- **영향**: 값이 들어가더라도 무시된다. 만료 링크가 계속 열리고, 비밀번호가 걸린 발행본이 무인증으로 열린다.

### 🟢 낮음

#### 11. 슬라이드 18종 중 11종이 타이머를 정리하지 않음

- **위치**: `joy_craft_web` `src/slides/**`
- **대상**: `balloon-pop`, `envelope-letter`, `fingerprint`, `flashlight`, `gift-box`, `heart-gauge`,
  `photo-puzzle`, `pin-lock`, `quiz`, `story-book`, `wish-lantern`
- **내용**: `setTimeout` / `setInterval`을 쓰면서 언마운트 시 `clear*`를 호출하지 않는다.
- **완화 상태**: `PlayerPage`가 완료 신호에 인덱스를 실어 대조하고 `SlideCanvas`가 `slideKey`로 리마운트해 오작동은 막고 있다. 근본 원인은 남아 있다.

#### 12. 번들 크기 / 폰트 배포

- **위치**: `joy_craft_web`
- **내용**:
  - 메인 청크 **561KB**(gzip 175KB) 단일 파일. 18종 슬라이드가 전부 여기 들어간다.
  - `DungGeunMo.ttf` **7.35MB**가 woff2 폴백으로 `dist/`에 함께 배포된다(브라우저는 woff2를 쓰므로 실제 다운로드는 안 되지만 배포물이 커진다).
  - Gmarket Sans는 `cdn.jsdelivr.net` 외부 CDN 의존이다.
- **영향**: 공개 공유 링크는 모바일에서 처음 열리는 화면이다. 초기 로딩이 곧 서비스 인상이다.

#### 13. `getMySites` N+1 쿼리

- **위치**: `joy_craft_api` `SiteService.getMySites()`
- **내용**: 사이트 목록을 가져온 뒤 사이트마다 `siteSlideRepository.countBySiteId()`를 호출한다.

#### 14. 미사용 설정 키 / 불필요한 필수 시크릿

- **위치**: `joy_craft_api` `application.yaml`
- **내용**: 아래 키가 코드 어디에서도 읽히지 않는다.
  - `session.sliding-expiry-days`, `session.sliding-throttle-minutes`, `session.grace-period-seconds`
  - `joycraft.storage.*` (MinIO) — `Asset` 엔티티만 있고 서비스/컨트롤러가 없다.
- **영향**: `JOYCRAFT_STORAGE_ACCESS_KEY` / `JOYCRAFT_STORAGE_SECRET_KEY`는 기본값이 없어서,
  **쓰지도 않는 기능 때문에 환경변수를 안 넣으면 애플리케이션이 기동되지 않는다.**

#### 15. `AuthGuard`가 라우트 이동마다 `/auth/me` 재호출

- **위치**: `joy_craft_web` `src/components/auth/AuthGuard.tsx`
- **내용**: 마운트마다 `fetchMe()`를 부른다. 보호 라우트 간 이동에서도 매번 호출된다.

---

## 3. 추가 권고 (수정 대상 외)

- **`contextLoads()`의 로컬 PostgreSQL 의존을 끊을 것.** 현재는 DB가 없는 개발자 머신·CI에서 `./gradlew build`가 무조건 실패한다. Testcontainers 도입이나 DB 불필요 테스트로의 분리를 권한다.
- 백엔드 테스트가 소스 80개 대비 3파일뿐이다. 서비스 계층(특히 `SiteService.publish` / `reorderSlides`) 테스트가 필요하다.

---

## 4. 수정 이력

15건 전부 수정했다 (2026-08-17). 커밋은 하지 않았고 두 저장소의 작업 트리에 반영돼 있다.

| # | 항목 | 저장소 | 상태 | 어떻게 고쳤나 |
|---|------|--------|------|--------------|
| 1 | 카카오 OAuth state | api+web | ✅ | 서버가 1회용 state를 발급→캐시 등록, 콜백에서 소모 검증. 프론트는 `sessionStorage`에 보관해 콜백 쿼리와 대조 |
| 2 | RestTemplate 타임아웃 | api | ✅ | `SimpleClientHttpRequestFactory`로 connect 3s / read 5s 지정 |
| 3 | 세션 무효화 우회 | api+web | ✅ | 세션 TTL을 JWT 수명에서 파생(+1분), `JwtFilter`를 fail-closed로 전환, `POST /api/auth/logout` 추가 후 프론트 로그아웃 연결 |
| 4 | 발행 slug 충돌 | api | ✅ | SecureRandom 기반 10자리(혼동 문자 제외 31자셋) + `existsBySlug` 선확인 재시도 |
| 5 | reorderSlides 검증 | api | ✅ | 전체 슬라이드의 순열일 때만 허용, 아니면 `SLIDE_ORDER_INVALID`(400) |
| 6 | 이전 발행본 폐기 | api | ✅ | 재발행 시 살아 있는 발행본을 전부 `revoke()` |
| 7 | 401/403 정합성 | api | ✅ | `exceptionHandling`에 EntryPoint/AccessDeniedHandler 추가 — 인증 없음=401, 권한 없음=403 |
| 8 | 계정 열거 | api | ✅ | 실패 사유를 `INVALID_CREDENTIALS` 하나로 통일 + 더미 해시 비교로 응답 시간 평준화 |
| 9 | 조회수 원자적 증가 | api | ✅ | `@Modifying` UPDATE 쿼리로 DB에서 증가 |
| 10 | 발행 만료 검사 | api | ✅ | `PublicationService`에서 만료 검사, 비밀번호 걸린 발행본은 fail-closed |
| 11 | 슬라이드 타이머 정리 | web | ✅ | `useSlideTimeout` 훅 신설 후 12개 슬라이드에 적용 (언마운트 시 일괄 취소) |
| 12 | 번들/폰트 | web | ⚠️ 부분 | 라우트 지연 로딩 + 슬라이드 등록을 `SlideCanvas`로 이동 + TTF 폴백 제거. **남은 것은 3. 참고** |
| 13 | getMySites N+1 | api | ✅ | `GROUP BY` 한 번으로 사이트별 슬라이드 수 집계 |
| 14 | 미사용 설정 키 | api | ✅ | `session.sliding-*`, `grace-period`, `joycraft.storage.*` 제거 (.env.example 동기화) |
| 15 | AuthGuard 재호출 | web | ✅ | 확인 완료한 토큰을 기억해 라우트 이동마다 `/auth/me`를 다시 부르지 않음 |

### 수정 후 검증 결과

| 항목 | 결과 |
|------|------|
| FE `tsc -b` | ✅ 에러 0 |
| FE `vitest run` | ✅ **159/159 통과** (회귀 없음) |
| FE `oxlint` | ✅ 에러 0 / 경고 2 (수정 전과 동일, 새로 생긴 경고 없음) |
| FE `vite build` | ✅ 성공, 청크 크기 경고 사라짐 |
| BE `compileJava` | ✅ 성공 |
| BE 보안 테스트 8건 | ✅ 전부 통과 |
| BE `build` 전체 | ⚠️ 9건 중 1건 실패 — `contextLoads()`, **수정 착수 전과 동일한 PostgreSQL 부재 문제** |

### 번들 크기 변화 (#12)

| | 수정 전 | 수정 후 |
|---|---------|---------|
| 최대 청크 | 561.75 kB (gzip 175.23) 단일 파일 | 243.52 kB (gzip 78.39) |
| 공유 링크(`/play/:slug`) 전송량 | 561.75 kB | index 243.5 + PlayerPage 5.1 + SlideCanvas 86.7 ≈ **335 kB** (gzip ≈ 104 kB) |
| 배포물 내 폰트 | woff2 946 kB + **ttf 7,354 kB** | woff2 946 kB |
| 청크 크기 경고 | 발생 | 없음 |

### ⚠️ 3번 수정의 운영상 영향 — 반드시 알고 있을 것

`JwtFilter`를 fail-closed로 바꿨기 때문에 **세션 캐시에 없는 토큰은 전부 거부된다.**
세션 캐시는 인메모리(Caffeine)이므로 다음 두 경우에 전 사용자가 재로그인해야 한다.

1. **API 서버 재시작** — 개발 중 `bootRun` 재시작 때마다 로그인이 풀린다.
2. **인스턴스를 2대 이상으로 늘릴 때** — 인스턴스마다 캐시가 따로 놀아서,
   A에서 로그인한 사용자가 B로 요청이 가면 거부된다. **스케일아웃 전에 반드시
   Redis 등 공유 세션 저장소로 옮겨야 한다.**

이건 fail-closed의 대가다. 그대로 두면(fail-open) 로그아웃·강제 퇴장이 아예 동작하지 않으므로
보안 쪽을 택했다. 다중 인스턴스 운영 계획이 있다면 세션 저장소 교체를 선행 과제로 잡을 것.

### #12에서 남긴 것

아래 둘은 이번 범위에서 처리하지 않았다.

1. **슬라이드 18종 개별 지연 로딩** — 지금은 플레이어가 18종을 한 청크(86.7 kB)로 받는다.
   스냅샷이 실제로 쓰는 슬라이드만 받으려면 `registry.ts`와 18개 `index.ts`를
   `React.lazy` 로더 등록 방식으로 바꿔야 한다. 구조 변경이라 별도 작업으로 둔다.
2. **Gmarket Sans의 jsdelivr CDN 의존** — 자체 호스팅하려면 폰트 바이너리를
   저장소에 추가해야 해서 이번에 손대지 않았다.

---

## 5. 2차 검토 (수정본 대상 재점검)

수정한 코드를 대상으로 전체를 다시 돌리고, **1차 수정이 새 문제를 만들지 않았는지** 다시 봤다.

### 재검증 결과

| 항목 | 결과 |
|------|------|
| FE `tsc -b` | ✅ 에러 0 |
| FE `vitest run` | ✅ 159/159 통과 |
| FE `oxlint` | ✅ 에러 0 / 경고 2 (1차와 동일, 새 경고 없음) |
| FE `vite build` | ✅ 성공 |
| BE `clean build` (전체 재빌드) | ⚠️ **14건 중 1건 실패** — `contextLoads()`(DB 부재), 착수 전과 동일 |
| BE 보안 테스트 | ✅ **13/13 통과** (신규 `SecurityConfigAuthResponseTest` 5건 포함) |

> 백엔드 테스트는 3건 → **14건**으로 늘었다(신규 5건 + 기존 9건).
> 늘어난 5건은 인증 실패 시 상태 코드를 실제로 검증하는 테스트이며 DB가 필요 없다.

### ✅ R1. 6번 수정의 부작용 — 재발행하면 이미 공유한 링크가 죽는다 **(해결)**

- **어쩌다**: 6번에서 "재발행 시 이전 발행본을 `revoke()`"로 고쳤다. 그 결과 재발행할 때마다
  **직전에 공유한 링크가 404**가 된다(`PlayerPage`의 "없거나 삭제된 링크예요" 화면).
- **왜 문제인가**: JoyCraft는 "링크를 만들어 남에게 보내는" 서비스다.
  링크를 보낸 뒤 오타 하나 고쳐 재발행하면, 받은 사람 전원의 링크가 깨진다.
  **원래 문제(옛 링크가 옛 내용을 계속 보여줌)보다 더 나쁠 수 있다.**
- **원래 사용자가 기대하는 동작**: *같은 링크에서 바뀐 내용이 보인다.*
- 현재 구조로는 이걸 만들 수 없다. `site_publications.slug`가 전역 UNIQUE라
  새 발행본이 옛 slug를 물려받을 수 없고, `SitePublication`은 코드 주석에
  **"★ 불변 엔티티 ★ 발행 이후에는 절대 UPDATE하지 않는다"**라고 못박혀 있어
  스냅샷을 덮어쓰는 것도 설계에 어긋난다.
- **선택 결과: 고정 공개 slug 도입** (링크 영구 유지 + 발행 이력 보존)

#### 바뀐 구조

| | 역할 | 재발행하면 |
|---|------|-----------|
| `sites.public_slug` | 사람에게 나가는 **고정 주소** (`/play/{public_slug}`) | **안 바뀐다** |
| `site_publications.slug` | 발행본 하나하나의 식별자(이력) | 매번 새로 생긴다 |

- `V8__add_site_public_slug.sql` — 컬럼 추가 + UNIQUE + 부분 인덱스.
  **기존에 발행된 사이트는 현재 살아 있는 발행본의 slug를 그대로 물려받도록 백필**해서,
  이 변경 이전에 공유한 링크가 깨지지 않는다.
- `SiteService.publish()` — 첫 발행에만 `assignPublicSlugIfAbsent()`로 공개 slug를 부여하고,
  `PublishResponse.url`은 `/play/{public_slug}`를 돌려준다.
- `PublicationService.resolve()` — ① `public_slug` → 그 사이트의 최신 발행본,
  ② 못 찾으면 발행본 자체 slug(구 링크 호환) 순서로 찾는다.
- `generateUniqueSlug()` — 두 테이블 모두에서 비어 있는 값만 쓴다(해석이 모호해지지 않도록).

> ⚠️ **V8 마이그레이션은 실제 DB에 적용해 보지 못했다.** 로컬에 PostgreSQL이 없어서다.
> 컴파일과 문법 수준까지만 확인했으니, **개발 DB에서 한 번 돌려보고 배포할 것.**

### ✅ R2. 인증 없는 `GET /api/auth/me` 가 500 (1차에서 놓침 — 수정 완료)

- `/api/auth/**` 가 통째로 permit-all이라 토큰 없는 요청이 컨트롤러까지 들어가고,
  `userId`가 null인 채 `findById(null)`을 호출해 **500 + 에러 스택 로그**가 났다.
- `/api/auth/me` 만 `authenticated()`로 분리해 401을 주도록 고쳤다.
- `SecurityConfigAuthResponseTest` 5건을 새로 추가해 401/403 동작을 런타임으로 증명했다.

### ✅ R3. `PublicationService`의 준영속 접근 순서 (수정 완료)

- `incrementViewCount`가 `clearAutomatically = true`라 영속성 컨텍스트를 비우는데,
  그 **뒤에** `publication.getSnapshot()`을 호출하고 있었다.
  지금은 snapshot이 즉시 로딩이라 우연히 동작했다. 스냅샷을 먼저 꺼내도록 순서를 바꿨다.

### ✅ R4. 상태 updater 안에서 타이머를 예약한다 (수정 완료)

- `setState(prev => { ... 타이머 예약 ... })` 형태였다. `main.tsx`가 StrictMode를 쓰므로
  **개발 모드에서 updater가 두 번 실행되어 타이머가 두 번 잡힌다.**
- `HeartGauge`, `PinLock`, `Flashlight` 세 곳에서 부작용(진동·소리·타이머)을 updater 밖으로 뺐다.
  - `Flashlight`는 spot을 여러 개 동시에 찾았을 때 진동을 개수만큼 울리던 것이 1회로 바뀌었다(의도된 정리).
- `BalloonPop`은 애초에 updater 밖에서 예약하고 있었다 — **수정 불필요.**
- 전 슬라이드를 재검사해 updater 내부 타이머 예약 **0건**을 확인했다.

### ✅ R5. `TokenHashUtils` 삭제 (수정 완료)

어디에서도 참조되지 않는 사문화 클래스라 파일을 지웠다.

### ✅ R8. 검색어 LIKE 와일드카드 이스케이프 (수정 완료)

- `ComponentService.escapeLikeWildcards()`로 `\` `%` `_` 를 이스케이프하고,
  쿼리 3곳에 `ESCAPE '\'` 를 붙였다. 이제 "50%" 검색이 글자 그대로 동작한다.
- (원래도 파라미터 바인딩이라 **SQL 인젝션은 아니었다.**)

### 🟢 R6~R7. 로그인 흐름 불일치 (미수정 — 기능 추가 시 정리 필요)

- **R6** `api/auth.ts` 의 `login` / `forceLogin` / `register` 를 호출하는 화면이 없다.
  **비밀번호 로그인 UI가 아예 없고 카카오 로그인만 연결돼 있다.**
- **R7** 그래서 `AuthService.login`의 정교한 중복 세션 감지(conflict → preAuthTicket → force-login)는
  **UI에서 도달할 수 없는 경로**다. 반면 `KakaoAuthService.handleCallback`은 그 검사 없이
  세션을 바로 덮어쓴다. 비밀번호 로그인 UI를 만들 때 두 흐름을 맞춰야 한다.
  - 참고: 3번 수정으로 세션 TTL이 5분 → 31분이 되면서, 비밀번호 로그인을 UI에 붙이면
    "탭만 닫고 나갔다가 30분 안에 다시 로그인" 하는 흔한 경우에도 중복 세션 프롬프트가 뜬다.
    이 UI를 만들 때 정책을 함께 정할 것.

### 이상 없음으로 확인한 것 (2차)

- `ControllerLoggingAspect` — URI·상태·소요시간만 남기고 요청 본문을 찍지 않는다. 민감정보 유출 없음.
- 템플릿 조회 쿼리 — `JOIN FETCH`로 N+1 없음, 파라미터 바인딩으로 인젝션 없음.
- `editorStore` — 저장 중복/유실 방지 로직이 촘촘하고 테스트도 붙어 있다.
- FE↔BE 계약 — 경로·슬라이드 slug 18종 모두 여전히 일치.

---

## 6. 3차 — API 저장소 롤백 후 재적용 (2026-08-18)

### 무슨 일이 있었나

`joy_craft_api`의 **추적 파일 전체가 HEAD(`2d8ec65`)로 되돌아갔다.** `git status`에 `M`이 하나도
없고 신규 파일만 `??`로 남아 있었다. 그 결과:

- 1·2차에서 적용한 수정이 추적 파일에서 전부 사라졌다.
- **사용자가 직접 하셨던 미커밋 작업도 함께 사라졌다** (CORS 설정, 환경변수 기반 설정,
  KST 통계, 템플릿 검색 연결).
- 반면 새로 만든 파일(`PublicationService`, `SecurityConfigAuthResponseTest`, `V8` 등)은 남았고,
  이들이 사라진 코드를 참조해서 **빌드가 깨져 있었다**(`cannot find symbol` 5건).

### 재적용 결과

HEAD 기준선 위에 1·2차 수정 전부를 다시 얹고, 지워진 사용자 작업도 함께 복구했다.

| 구분 | 내용 |
|------|------|
| 재적용 | 1~15번 + R1~R5·R8 전부 |
| 복구 | CORS 설정(`SecurityConfig`), KST 통계(`AdminController` → `ServiceTimeUtils`) |
| **신규 발견·수정** | `ComponentController`가 `search` 파라미터를 **받기만 하고 서비스에 넘기지 않아 검색이 전혀 동작하지 않던 버그** |
| 유지 | 개발 DB 접속 설정은 사용자가 설정한 값 그대로 두었다 |

### 검증 결과 — DB 연결 후

| 항목 | 결과 |
|------|------|
| BE `compileJava` + `compileTestJava` | ✅ 성공 |
| BE `test` | ✅ **14/14 전부 통과 (실패 0, 에러 0)** |
| └ `contextLoads()` | ✅ **이번에 처음 통과** — 개발 DB 연결로 해결 |
| └ 보안 테스트 13건 | ✅ 통과 |
| FE `tsc` / `vitest` / `vite build` | ✅ 에러 0 / **159/159** / 성공 |

### ⛔ 남은 한 단계 — V8 적용 (사용자 실행 필요)

`spring.jpa.hibernate.ddl-auto: validate` 인데 `Site.publicSlug` 필드가 추가됐으므로,
**V8 마이그레이션이 적용되기 전까지 애플리케이션은 기동되지 않는다.**
Flyway가 켜져 있으므로 앱을 한 번 띄우면 자동 적용된다.

```powershell
cd D:\develop\joycraft\joy_craft_api
$env:JAVA_HOME = "C:\Users\dltkd\.jdks\corretto-21.0.9"
.\gradlew.bat bootRun
```

원격 공유 DB에 스키마를 변경하는 동작이라 자동 실행이 차단되어 직접 실행이 필요하다.
되돌리려면: `ALTER TABLE sites DROP COLUMN public_slug;`

### ⚠️ 현재 설정에서 짚어둘 점

되돌아온 `application.yaml`은 1·2차에서 정리했던 상태가 아니다. 지금 상태의 위험 요소:

1. **DB 비밀번호·카카오 시크릿·JWT 키가 저장소에 평문으로 커밋되어 있다.**
   원격 저장소에 올라가면 이력에서 지우기 어렵다. 환경변수/`.env`로 빼는 것을 권한다.
2. `flyway.clean-disabled: false` — **`flyway:clean` 한 번에 스키마 전체가 삭제된다.**
   히스토리 정리가 끝났다면 `true`로 되돌릴 것.
3. `flyway.validate-on-migrate: false` — 체크섬 검증이 꺼져 있어 마이그레이션 파일이
   바뀌어도 경고 없이 넘어간다.
