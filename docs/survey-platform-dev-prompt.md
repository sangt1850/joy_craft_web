# 설문 실험 사이트 — JoyCraft 프로젝트 기반 개발 계획서 (Claude Code용)

> 석사 논문용 **온라인 실험 설문 사이트**를 기존 JoyCraft 웹/API 프로젝트에 "임시로 붙여서" 만든다.
> 기존 서비스 화면은 전부 비활성화하고, 기존 API·DB·테이블은 **건드리지 않고 그대로 둔다.**
> 설문 기능은 별도 폴더/패키지/테이블(`sv_` 접두사)/Flyway 이력 테이블로 완전히 격리해서, 데이터 수집이 끝나면 통째로 걷어낼 수 있게 한다.
>
> - **응답자 화면 디자인·구조 레퍼런스**: `C:\Users\dltkd\Downloads\survey-frontend` (React 18 + Vite, 목 API 포함). M1에서 `docs/survey/design-reference/`로 복사해 저장소에 보존한다(다운로드 폴더는 언제든 사라질 수 있음).
> - **설문 문항 원문**(4.3 변수의 측정 문항 구성): `docs/survey/questionnaire.md` **(현재 없음 — M0에서 반드시 준비)**

---

## 0. 원본 계획 대비 변경 요약

| 항목 | 원본 문서 | 이 계획 (프로젝트 상황 반영) |
|---|---|---|
| 저장소 구조 | 신규 모노레포(`/backend`, `/frontend`) | **기존 2개 저장소 재사용** — `joy_craft_web`, `joy_craft_api` 안에 별도 폴더/패키지 |
| Frontend | React 18, TanStack Query, 신규 작성 | 기존 **React 19 + Vite 8 + TS + React Router 7** 위에 **레퍼런스 `survey-frontend`를 `src/survey/`로 이식**. TanStack Query 추가 안 함 |
| 디자인 | Tailwind 권장 | 레퍼런스 디자인 그대로(중립 블루 액센트, Noto Sans KR, 카드형 모바일 480px). **plain CSS, Tailwind·JoyCraft 디자인 시스템 미사용** |
| Backend | Spring Boot 3, Java 17 | 기존 **Spring Boot 4.1, Java 21, Gradle(KTS)**, JdbcTemplate 사용(JPA 엔티티 안 만듦) |
| DB | 신규 PostgreSQL + Docker Compose | **기존 운영 PostgreSQL(`joy_craft`) 그대로 사용**, 테이블만 `sv_` 접두사로 추가 |
| 마이그레이션 | Flyway V1/V2 | 기존 Flyway 이력(V1~V25)과 **분리된 이력 테이블** `sv_flyway_schema_history` + `classpath:db/survey` |
| API 경로 | `/api/s/{code}` | `/api/survey/{code}` (기존 경로와 충돌 방지). 레퍼런스 클라이언트의 경로만 바꿔서 이식 |
| API 응답 | 엔드포인트별 상이 | 레퍼런스 계약 채택: **start / current / submit 모두 같은 `CurrentResponse` 반환**(submit 후 재조회 왕복 제거). JoyCraft 규약대로 `{data: …}` 봉투 |
| 관리자 API | `/api/admin/{code}` | `/api/survey/admin/{code}` (기존 `AdminController`와 분리) |
| 기존 화면 | — | `VITE_APP_MODE=survey`일 때 **설문 앱만 마운트**. 기존 `App.tsx`·`index.css`(Tailwind)는 로드조차 안 함 |
| 배포 | nginx + jar 신규 구성 | 기존 배포 그대로: 웹 `chaenesis.site`, API `api.chaenesis.site`(`deploy.sh`, GitHub Actions) |

---

## 1. 현재 프로젝트 상황 (조사 결과)

### 1.1 Web — `D:\develop\joycraft\joy_craft_web`

| 항목 | 현황 |
|---|---|
| 스택 | React 19.2, Vite 8, TypeScript 6, Tailwind v4(`@tailwindcss/vite`), react-router-dom 7, zustand, vitest, oxlint |
| 진입점 | `src/main.tsx`(여기서만 `./index.css` import) → `src/App.tsx` (BrowserRouter, 페이지 전부 `lazy`) |
| 라우트 | `/`, `/play/:slug`, `/auth/kakao/callback`, `/editor/:siteId`, `/master/*`, `/*`(고객 앱, `AuthGuard`) |
| API 클라이언트 | `src/api/client.ts` — `VITE_API_BASE_URL`(로컬 `/api`, 운영 `https://api.chaenesis.site`), `credentials: "include"`, 401 시 `/`로 리다이렉트 |
| 개발 서버 | `:2222`, `/api` → `http://localhost:2223` 프록시 |
| 환경 파일 | `.env.local`(`VITE_API_BASE_URL=/api`), `.env.production`(`VITE_API_BASE_URL=https://api.chaenesis.site`) |
| 디자인 시스템 | Neo-Brutalism (`CLAUDE.md`, `src/components/ui`, `src/components/nb`) — **설문에는 적용하지 않음** |

### 1.2 레퍼런스 — `C:\Users\dltkd\Downloads\survey-frontend`

| 항목 | 내용 |
|---|---|
| 스택 | React 18.3, react-router-dom 6, Vite 5, TS 5. 런타임 의존성은 react/react-dom/router뿐 |
| 구조 | `api/{types,client,mock}.ts`, `hooks/useDwellTracker.ts`, `components/{Layout,Choices,Toast}.tsx`, `views/{SurveyPage,ConsentView,QuestionsView,StimulusView,EndView,types}.tsx`, `styles.css` |
| 동작 | start → enter → submit, 뒤로가기 차단, 이탈 경고, 자극물 이미지 로딩 후 타이머 시작·탭 숨김 시 정지, 필수 누락 시 스크롤+빨간 테두리, QUOTA_FULL 시 재조회, ATTENTION_FAIL은 완료와 동일하게 표시, redirectUrl 3초 후 이동 |
| 목 API | `VITE_USE_MOCK=true`(`.env.mock`)면 sessionStorage 기반 목 서버 사용. 스크리닝 종료·45초 검증·보기 쿼터 마감 흉내. `?reset`으로 처음부터 |
| 디자인 | 3.1절 토큰 참고 |

### 1.3 API — `D:\develop\joycraft\joy_craft_api`

| 항목 | 현황 |
|---|---|
| 스택 | Spring Boot 4.1.0, Java 21, Spring Data JPA, Security(JWT, STATELESS), Validation, Flyway 11, Caffeine, Lombok |
| 포트 | `2223` |
| 패키지 | `com.joycraft.api.{asset,component,site,user,nas,global,common}` — 각각 `controller/service/entity/repository/dto` |
| 공통 규약 | 성공 `ApiResponse.of(data)` → `{ "data": ... }`, 실패 `ErrorResponse{code,message}`, `BusinessException(ErrorCode)` → `GlobalExceptionHandler` |
| 보안 | `SecurityConfig` — permit-all: `/api/auth/**`, `/api/play/**` 등, 나머지 인증 필요. `JwtFilter.shouldNotFilter`에 공개 경로 목록 |
| CORS | `joycraft.cors.allowed-origins` (로컬 `http://localhost:2222`, 운영 `https://chaenesis.site`), `allowCredentials=true` |
| JPA | `ddl-auto: validate`, `open-in-view: false` |
| Flyway | `classpath:db/migration`, V1~V24 + **미커밋 V25(loveflix)** 존재, `baseline-on-migrate`, `validate-on-migrate: false` |
| 스케줄러 | `@EnableScheduling` **없음** → 설문 패키지에서 추가 필요 |
| DB | local / prod / test 프로파일이 **모두 같은 원격 DB(`joy_craft`)를 가리킴** ⚠️ |

### 1.4 이 상황에서 나오는 설계 제약

1. **운영 DB 공유** → 설문 테이블은 반드시 접두사(`sv_`)로 분리하고, 기존 테이블에 FK·컬럼 추가 금지.
2. **Flyway 버전 충돌 위험** → 기존 `db/migration`에 V26을 넣으면 loveflix V25 등 진행 중인 작업과 번호가 엉킨다. `validate-on-migrate: false`라서 낮은 번호가 조용히 무시되는 사고도 가능. → **별도 이력 테이블로 분리** (5.3절).
3. **테스트 DB가 운영 DB와 같다** → (결정) Docker 없이 이 DB를 그대로 쓰되, 통합 테스트는 ① 메인 Flyway를 끄고(미커밋 마이그레이션이 적용되지 않게) ② 테스트마다 전용 설문 `t_xxxx`를 만들어 ③ `sv_` 테이블만 건드리고 ④ 끝나면 그 설문의 행을 지운다 (14절).
4. **JPA `ddl-auto: validate`** → 설문 쪽을 JPA 엔티티로 만들면 기동 시점 검증 순서 문제가 생긴다. 설문은 **JdbcTemplate 전용**으로 만든다 (원자적 `UPDATE ... RETURNING`에도 이쪽이 자연스럽다).
5. **운영은 웹/API가 서브도메인 분리**(`chaenesis.site` ↔ `api.chaenesis.site`) → 응답자 쿠키는 same-site라 `SameSite=Lax`로 전달됨. 운영에서는 `Secure` 필수. 레퍼런스 클라이언트는 `/api` 상대경로 고정이므로 `VITE_API_BASE_URL`을 쓰도록 바꿔서 이식.
6. **전역 CSS 충돌** → 레퍼런스는 `.card`, `.chip`, `.badge`, `html, body` 같은 전역 셀렉터를 쓴다. JoyCraft `index.css`(Tailwind preflight + 전역 토큰)와 섞이면 깨지므로 **survey 모드에서는 `index.css`를 아예 로드하지 않는다** (4.1절).

---

## 2. 목표와 범위

### 2.1 필수 기능 (원본 유지)
1. 데이터 기반 설문 렌더링 (DB의 페이지·문항·보기로 화면 구성)
2. **자극물 페이지 강제 대기** (이미지/텍스트, 최소 45초, 그 전엔 다음 버튼 비활성, 서버 재검증)
3. **페이지별 체류 시간 기록** (서버 시각 + 클라이언트 활성 시간)
4. **무작위 그룹 할당** (A/B, 각 250명 균형, 쿼터 기반)
5. **쿼터** — 그룹 쿼터 + 특정 보기 쿼터 (예: "마음에 든다" 250 / "마음에 들지 않는다" 250)
6. **조건부 종료** (스크리닝 불충족 → SCREENOUT, 주의 점검 실패 → 표본 제외)
7. 응답 데이터 **CSV 내보내기** (wide format)

### 2.2 추가 (프로젝트 운영상 필요)
- 설문 상태 `TEST`(파일럿) — 이 상태에서만 응답 데이터 리셋 API 허용
- 통계 API(curl용), 헬스체크
- 기존 화면 일괄 비활성화 스위치 (`VITE_APP_MODE`)
- 백엔드 없이 화면 확인하는 목 모드 (레퍼런스 `mock.ts` 이식)
- 수집 종료 후 원복/제거 절차 (16절)

### 2.3 비범위 (만들지 말 것)
- 설문 편집 UI, 관리자 대시보드 **화면** (curl/CSV로 충분)
- 주관식 입력
- 로그인/회원 연동 (응답자는 익명 + 패널 uid만)
- 기존 JoyCraft 기능 수정

---

## 3. 아키텍처

```
[응답자 브라우저]
   │  https://chaenesis.site/s/{code}?uid=PANEL123
   ▼
joy_craft_web (VITE_APP_MODE=survey)
   src/main.tsx ──► src/survey/SurveyApp.tsx + survey.css
   │                 (App.tsx·index.css·Tailwind는 로드 안 함)
   │  fetch(credentials: include) — 쿠키 sv_rid
   ▼
joy_craft_api  /api/survey/**  (permit-all, JWT 필터 건너뜀)
   com.joycraft.api.survey.*   (JdbcTemplate, 자체 예외 핸들러, 스케줄러)
   │
   ▼
PostgreSQL joy_craft
   ├─ 기존 테이블 (users, sites, ...)          ← 손대지 않음
   ├─ flyway_schema_history                    ← 기존 이력, 손대지 않음
   ├─ sv_* 테이블 10개                          ← 설문 전용
   └─ sv_flyway_schema_history                 ← 설문 전용 이력
```

**서버가 반드시 책임지는 것** (클라이언트는 표시만):
- 쿼터 예약/확정/해제 (DB 원자적 연산)
- 그룹 할당
- 45초 대기 검증 (DB `now()` 기준 — 앱 서버와 DB 시계 차이 배제)
- 현재 페이지 위치(`current_page_seq`) — 건너뛰기·뒤로가기 차단
- 진행률(`progressIndex`/`totalPages`) 계산 — 그룹별로 보이는 페이지가 달라서

### 3.1 디자인 (레퍼런스 `styles.css` 그대로)

경외감·신기함을 측정하는 실험이므로 UI 자체가 교란 변수가 되지 않도록 **중립적인 설문 UI**를 쓴다. JoyCraft Neo-Brutalism은 적용하지 않는다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--accent` / `--accent-strong` / `--accent-weak` / `--accent-ink` | `#1f5bd8` / `#1648b0` / `#eef3fd` / `#1a3a80` | 버튼, 진행 바, 선택 상태, 안내 박스 |
| `--bg` / `--surface` | `#f2f4f7` / `#ffffff` | 페이지 배경 / 카드 |
| `--line` / `--line-strong` | `#e3e7ed` / `#c9d0da` | 구분선 / 입력 테두리, 비활성 버튼 |
| `--text` / `--text-2` / `--text-3` / `--disabled-text` | `#1a1d23` / `#4a5260` / `#5b6472` / `#6b7380` | 본문 / 보조 / 캡션 / 비활성 |
| `--danger` | `#d93025` | 필수 표시, 미응답 오류 |
| `--warn-bg` / `--warn-ink` | `#fff6e5` / `#6b4600` | 쿼터 마감 안내 |
| `--radius` / `--radius-sm` | `12px` / `8px` | 카드 / 버튼·보기 |
| 폰트 | Noto Sans KR 400/500/700 | 전부 |

레이아웃 규칙:
- `.screen` 최대 폭 480px 가운데 정렬, `100dvh`. 상단 sticky `ProgressHeader`(제목 + `n / total` + 4px 바), 하단 sticky `BottomBar`(52px 주 버튼, `env(safe-area-inset-bottom)` 반영).
- 동의/종료 화면은 상단 8px 액센트 스트립 + 히어로 카드(`card--hero`, 상단 6px 액센트 보더).
- 리커트: 7칸 grid, 버튼 높이 44px, 선택 시 액센트 채움 + 흰 글자, 아래 라벨 "전혀 그렇지 않다 / 보통 / 매우 그렇다".
- 단일 선택: 52px 행 전체 터치, 선택 시 액센트 보더 + 연한 배경, 마감 보기는 회색 + "모집 마감" 배지.
- 비활성 "다음" 버튼은 회색이지만 **클릭은 받음**(`aria-disabled`) → 첫 미응답 문항으로 스크롤 + 카드 빨간 테두리.
- `prefers-reduced-motion`이면 애니메이션 전부 끔.

> 프로젝트 `CLAUDE.md`의 "팔레트 외 HEX 금지 / Neo 컴포넌트 필수 / 큰 radius 금지" 규칙은 **`src/survey/` 안에서는 예외**다. M1에서 `CLAUDE.md`에 이 예외를 한 줄 추가해, 이후 작업자가 설문 화면을 Neo 스타일로 "고치지" 않게 한다.

---

## 4. Web 구현 계획

### 4.1 기존 화면 비활성화 방식

`App.tsx`와 기존 페이지는 **한 줄도 수정하지 않는다.** `main.tsx`에서 모드에 따라 루트 컴포넌트와 **전역 CSS까지** 동적으로 고른다.

```tsx
// src/main.tsx
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

// 설문 수집 기간에는 기존 서비스 화면을 통째로 내리고 설문 앱만 띄운다.
// index.css(Tailwind preflight·전역 토큰)도 기존 앱 쪽에서만 불러와
// 설문 전용 CSS(.card, html/body 등 전역 셀렉터)와 충돌하지 않게 한다.
const Root =
  import.meta.env.VITE_APP_MODE === "survey"
    ? lazy(() => import("./survey/SurveyApp"))
    : lazy(() => import("./index.css").then(() => import("./App")));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
);
```

- `.env.local`, `.env.production`에 `VITE_APP_MODE=survey` 추가. 원복은 이 값만 지우면 된다.
- 목 모드용 `.env.survey-mock`: `VITE_APP_MODE=survey`, `VITE_USE_MOCK=true`, `VITE_MOCK_STIMULUS_SECONDS=5`. `package.json`에 `"dev:survey-mock": "vite --mode survey-mock"` 추가.
- `src/vite-env.d.ts`(없으면 생성)에 `VITE_APP_MODE`, `VITE_USE_MOCK`, `VITE_MOCK_STIMULUS_SECONDS` 타입 추가.
- `SurveyApp` 마운트 시 `document.title = "설문 조사"`, `<html lang="ko">` 유지.
- Noto Sans KR: `survey.css` 최상단 `@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap");` (공용 `index.html`은 건드리지 않음). `viewport-fit=cover`는 `index.html` meta에 이미 있는지 확인하고 없으면 추가(safe-area 반영에 필요, 기존 앱에도 무해).

### 4.2 폴더 구조 (레퍼런스 구조 유지 + 이식)

```
src/survey/
├── SurveyApp.tsx            레퍼런스 main.tsx의 라우터 부분 (BrowserRouter + /s/:code + NotFound)
├── survey.css               레퍼런스 styles.css 그대로 (+ 폰트 @import)
├── api/
│   ├── types.ts             레퍼런스 types.ts + 에러 코드 추가 (4.6)
│   ├── client.ts            경로 /survey/{code}/..., VITE_API_BASE_URL, {data} 봉투 해제
│   └── mock.ts              레퍼런스 mock.ts (dev 전용, 실제 문항 넣지 말 것 — 예시 문항만)
├── hooks/
│   └── useDwellTracker.ts   그대로
├── components/
│   ├── Layout.tsx           ProgressHeader, Screen, Body, BottomBar, Card — 그대로
│   ├── Choices.tsx          Likert7, SingleChoice, SelectChoice, QuotaNotice — 그대로
│   └── Toast.tsx            그대로
└── views/
    ├── SurveyPage.tsx       흐름 제어 — 4.4절 변경점만 반영
    ├── ConsentView.tsx      그대로
    ├── QuestionsView.tsx    그대로
    ├── StimulusView.tsx     그대로 (+ 4.4 TOO_EARLY 보정)
    ├── EndView.tsx          그대로
    └── types.ts             그대로
```

`src/survey/` 밖에서 바뀌는 웹 파일: `src/main.tsx`, `.env.local`, `.env.production`, `.env.survey-mock`(신규), `package.json`(스크립트 1줄), `src/vite-env.d.ts`, `CLAUDE.md`(예외 1줄), 자극물 `public/survey/stimuli/**`.

### 4.3 React 18 → 19 / Router 6 → 7 / 린트 이식 체크

- `react-router-dom` 7은 `BrowserRouter`·`Routes`·`useParams`·`useSearchParams`를 그대로 export → 코드 변경 없음.
- React 19 타입: `useRef`는 초기값 필수 — 레퍼런스는 이미 전부 초기값을 넘김. ref 콜백은 `{ refs.current[id] = el; }`처럼 블록으로 감싸 반환값 없게(이미 그렇게 되어 있음).
- `// eslint-disable-line react-hooks/exhaustive-deps` 주석은 oxlint 기준으로 동작하는지 확인, 필요하면 `// oxlint-disable-line` 으로 교체.
- 레퍼런스 `tsconfig`가 아니라 프로젝트 `tsconfig.app.json`(TS 6, strict) 기준으로 `npm run build` 통과시킬 것.

### 4.4 레퍼런스 대비 변경점 (이것만 바꾼다)

| 위치 | 레퍼런스 | 변경 |
|---|---|---|
| `api/client.ts` | `fetch('/api' + path)`, 경로 `/s/{code}/…`, 응답 JSON 그대로 | `BASE = import.meta.env.VITE_API_BASE_URL ?? "/api"`, 경로 `/survey/{code}/…`, 성공 시 `body.data` 반환, 실패 시 `body.code`/`body.detail` 보존 |
| `api/types.ts` `ApiErrorCode` | 6종 | `NOT_ENTERED`, `RATE_LIMITED`, `RESPONDENT_NOT_FOUND`, `SURVEY_NOT_FOUND`, `INVALID_OPTION` 추가. `ApiError`에 `detail?: Record<string, unknown>` 추가 |
| `SurveyPage.handleSubmit` | QUOTA_FULL·INVALID_PAGE만 재조회 | `NOT_ENTERED` → `enter` 후 재시도 1회, `RESPONDENT_NOT_FOUND`(쿠키 만료) → `start` 재호출, `RATE_LIMITED` → 1초 후 재시도, `SURVEY_NOT_FOUND` → NotFound 문구 |
| `SurveyPage` 진입 | `uid`를 URL에 둔 채 진행 | start 성공 후 `history.replaceState`로 쿼리에서 `uid` 제거(링크 공유 시 uid 유출 방지). 뒤로가기 차단 pushState보다 먼저 실행 |
| `SurveyPage` enter 호출 | 실패 무시 | 그대로 무시하되, 실패 시 submit 단계의 `NOT_ENTERED` 처리로 복구 |
| `StimulusView` | 클라이언트 activeMs만으로 타이머 | 그대로. 서버가 `TOO_EARLY` + `detail.remainingMs`를 주면 토스트만 띄우고 사용자가 다시 누르게 둠(타이머 보정은 하지 않음 — 서버 wall-clock은 항상 클라이언트 activeMs 이상이므로 실제로는 거의 발생 안 함) |
| `mock.ts` | — | 설문 문항 원문을 넣지 말 것(예시 문항 유지). 실 문항은 DB에만 |
| 종료 화면 | `views/EndView` | 그대로 (`/s/:code/end` 별도 라우트 만들지 않음 — 원본 계획에서 변경) |

### 4.5 화면 흐름 (레퍼런스 `SurveyPage` 그대로)

```
mount ─► POST start(uid) ─► CurrentResponse
          │
          ├─ status ≠ IN_PROGRESS ─► EndView (redirectUrl 있으면 3초 후 이동 + "지금 이동하기")
          └─ page.pageType
               ├─ CONSENT   ─► ConsentView   (체크 안 하고 누르면 shake)
               ├─ STIMULUS  ─► StimulusView  (이미지 로딩 완료 → activeMs 카운트, 탭 숨김 시 정지)
               └─ QUESTIONS ─► QuestionsView (필수 누락 시 스크롤 + 빨간 테두리)
          page.seq 바뀔 때마다: POST enter, scrollTo(0,0)
          다음 클릭: POST submit({answers, clientActiveMs, hiddenCount, blurCount}) ─► CurrentResponse로 교체
```
- 뷰는 `key={page.seq}`로 마운트 → 페이지마다 응답·타이머·체류 측정 상태가 새로 시작.
- QuestionsView key에 보기 `available` 목록 포함 → 쿼터 마감 반영 재조회 시 선택 상태 초기화.
- 뒤로가기: pushState + popstate 토스트 "이전 문항으로 돌아갈 수 없어요." / 이탈 경고: IN_PROGRESS일 때만 `beforeunload`.

### 4.6 클라이언트 타입 (= 서버 응답 계약, 레퍼런스 `api/types.ts` 기준)

```ts
type RespondentStatus = 'IN_PROGRESS' | 'COMPLETE' | 'SCREENOUT' | 'QUOTAFULL' | 'ATTENTION_FAIL' | 'ABANDONED';
type PageType = 'CONSENT' | 'QUESTIONS' | 'STIMULUS' | 'END';
type QuestionType = 'LIKERT7' | 'SINGLE' | 'SELECT';

interface OptionDto   { id: number; value: number; label: string; available: boolean }
interface QuestionDto { id: number; qNo: string; code: string; text: string; qtype: QuestionType; required: boolean; options: OptionDto[] }
interface StimulusBlock { id: number; kind: 'IMAGE' | 'TEXT'; content: string; caption?: string }
interface ConsentContent { eyebrow: string; headline: string; summary: string; chips: string[];
                           sections: { heading: string; body: string }[]; agreeLabel: string }

interface PageDto {
  seq: number; pageKey: string; pageType: PageType;
  title: string; instruction?: string; minSeconds: number;
  progressIndex: number; totalPages: number;    // 서버 계산 (그룹별 노출 페이지 기준)
  questions: QuestionDto[]; stimulus: StimulusBlock[];
  consent?: ConsentContent;                      // CONSENT 페이지만
}
interface CurrentResponse { status: RespondentStatus; page?: PageDto; redirectUrl?: string }
interface EnterResponse   { enteredAt: string; serverNow: string }
interface SubmitRequest   { answers: { questionId: number; optionId: number; changeCount: number }[];
                            clientActiveMs: number; hiddenCount: number; blurCount: number }
```

### 4.7 자극물 파일
- `public/survey/stimuli/{surveyCode}/a-01.jpg` 형태로 웹 정적 파일로 둔다 → URL `/survey/stimuli/...`.
- DB `sv_stimulus_block.content`에는 이 상대 경로만 저장. `content`가 빈 IMAGE 블록은 레퍼런스처럼 플레이스홀더로 표시(파일럿 전 확인용).
- 이미지 최적화: 가로 1080px, WebP(+JPEG 폴백), 1장당 300KB 이하 권장.
- `alt`는 `caption` 또는 "관광 홍보 이미지".

---

## 5. API 구현 계획

### 5.1 기존 코드에 대한 변경 (이 3곳만)

| 파일 | 변경 |
|---|---|
| `global/security/SecurityConfig.java` | `.requestMatchers("/api/survey/**").permitAll()` 를 `anyRequest()` 앞에 추가 |
| `global/jwt/JwtFilter.java` | `shouldNotFilter`에 `\|\| uri.startsWith("/api/survey/")` 추가 |
| `src/main/resources/application.yaml` | `survey:` 설정 블록 추가 (5.6절) |

그 외 기존 클래스(`ErrorCode`, `GlobalExceptionHandler` 등)는 수정하지 않는다. 설문은 자체 예외/핸들러를 갖는다.

### 5.2 패키지 구조 (전부 신규)

```
com.joycraft.api.survey
├── config/
│   ├── SurveyProperties.java          @ConfigurationProperties("survey")
│   ├── SurveySchemaMigrator.java      설문 전용 Flyway 실행 (5.3절)
│   └── SurveySchedulingConfig.java    @EnableScheduling
├── controller/
│   ├── SurveyController.java          /api/survey/{code}/...
│   └── SurveyAdminController.java     /api/survey/admin/{code}/...
├── service/
│   ├── RespondentService.java         start/resume, 쿠키 식별, 상태 전이
│   ├── PageFlowService.java           CurrentResponse 조립, 다음 seq 계산, 그룹 필터, 진행률
│   ├── SubmitService.java             submit 트랜잭션 오케스트레이션
│   ├── QuotaService.java              예약/확정/해제 (원자적 SQL)
│   ├── GroupAssignmentService.java    그룹 할당
│   ├── QuotaExpiryScheduler.java      만료 hold 정리 (1분 주기)
│   └── ExportService.java             CSV / stats
├── repository/                         JdbcTemplate DAO (엔티티 없음)
│   ├── SurveyDefinitionRepository.java  survey/page/question/option/stimulus 조회 (Caffeine 캐시)
│   ├── RespondentRepository.java
│   ├── QuotaRepository.java
│   ├── AnswerRepository.java
│   └── PageVisitRepository.java
├── dto/                                record — 4.6절 타입과 필드명 1:1 (CurrentResponse, PageDto, ...)
├── domain/                             enum: RespondentStatus, PageType, QType, QuotaKind, OnFull, TimerMode, HoldStatus
└── support/
    ├── SurveyErrorCode.java            code + HttpStatus + message
    ├── SurveyException.java
    ├── SurveyExceptionHandler.java     @RestControllerAdvice(basePackages = "com.joycraft.api.survey"), @Order(HIGHEST_PRECEDENCE)
    ├── RespondentCookie.java           sv_rid 읽기/쓰기
    ├── IpHasher.java                   SHA-256(salt + ip)
    ├── AdminKeyGuard.java              X-Admin-Key 상수시간 비교
    └── SeededShuffle.java              respondentId+pageId 시드 셔플
```

- 코딩 컨벤션은 API `CLAUDE.md`를 따른다: `@RequiredArgsConstructor`, 쓰기 서비스 `@Transactional`, 한글 주석 규칙.
- DTO JSON 필드명은 **프론트 타입(4.6)과 정확히 일치**시킨다 (`pageKey`, `pageType`, `progressIndex`, `totalPages`, `stimulus`, `consent`). null 필드는 생략(`@JsonInclude(NON_NULL)`) — 프론트가 `?:` optional로 받음.
- 성공 응답은 기존 규약대로 `ApiResponse.of(data)`. 실패는 `{code, message, detail}` (기존 `ErrorResponse`와 `code/message` 필드명 호환, `detail`만 추가).

### 5.3 설문 전용 Flyway (기존 이력과 분리)

> ⚠️ **함정**: `Flyway` 타입의 `@Bean`을 새로 등록하면 Spring Boot의 `FlywayAutoConfiguration`이 `@ConditionalOnMissingBean(Flyway.class)` 때문에 **꺼져서 기존 마이그레이션이 안 돈다.** Flyway 객체는 빈으로 노출하지 말고 내부에서만 만든다.

```java
/** 설문 전용 스키마 마이그레이션 — 기존 flyway_schema_history와 분리된 이력 테이블을 쓴다 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SurveySchemaMigrator implements InitializingBean {

    private final DataSource dataSource;

    @Override
    public void afterPropertiesSet() {
        // 이미 기존 테이블이 있는 스키마라 baselineOnMigrate 없이는 "non-empty schema" 오류가 난다.
        // baseline 0 으로 두면 설문 V1부터 전부 적용된다.
        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/survey")
                .table("sv_flyway_schema_history")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();
    }
}
```

마이그레이션 파일: `src/main/resources/db/survey/`
- `V1__survey_schema.sql` — 스키마 (6절)
- `V2__survey_seed.sql` — 설문 정의 seed (10절). 개발 중 문구 수정은 `V3__...` 추가.

### 5.4 응답자 식별 (쿠키)

- 쿠키 이름 `sv_rid`, 값 = respondent UUID, `HttpOnly`, `SameSite=Lax`, `Path=/api/survey/{code}`, `Max-Age=7일`, `Secure`는 운영만(`auth.refresh-cookie-secure` 값 재사용).
- 운영: 웹 `chaenesis.site` ↔ API `api.chaenesis.site`는 same-site이므로 `Lax`로 fetch에 실림. CORS는 기존 설정(`allowCredentials=true`, origin `https://chaenesis.site`)으로 충분.
- `Domain` 속성 지정 안 함(host-only, `api.chaenesis.site` 한정).

### 5.5 원자적 처리 원칙

- 모든 상태 변경 API는 트랜잭션 시작 직후 `SELECT ... FROM sv_respondent WHERE id = ? FOR UPDATE` 로 응답자 행을 잠근다 → 같은 응답자의 이중 submit 직렬화.
- 쿼터 증감은 조건부 `UPDATE ... RETURNING` 단일 문장 + 테이블 `CHECK` 제약 이중 방어.
- 해제는 **hold 상태 전이가 성공한 경우에만** 카운트를 감소시킨다(스케줄러·완료 처리 경합 시 이중 감소 방지):
  ```sql
  UPDATE sv_quota_hold SET status = 'RELEASED', released_at = now()
   WHERE respondent_id = :rid AND quota_id = :qid AND status = 'RESERVED';
  -- 1행 갱신된 경우에만:
  UPDATE sv_quota SET reserved_n = reserved_n - 1 WHERE id = :qid;
  ```
- 시간 비교는 전부 DB `now()` 사용 (`now() - entered_at >= make_interval(secs => min_seconds)`).

### 5.6 설정 (`application.yaml` 추가분)

```yaml
survey:
  admin-key: ${JOYCRAFT_SURVEY_ADMIN_KEY:}          # 비어 있으면 관리자 API 전부 403
  ip-hash-salt: ${JOYCRAFT_SURVEY_IP_SALT:}         # 비어 있으면 ip_hash 저장 안 함
  hold-ttl-minutes: ${JOYCRAFT_SURVEY_HOLD_TTL:60}  # 마지막 활동 기준(슬라이딩)
  attention-fail-immediate: false                   # true면 Q43 실패 즉시 종료
  active-ms-tolerance-ms: 1000                      # 클라이언트가 보고한 활성 시간 검증 허용 오차
  wall-tolerance-ms: 500                            # 서버 경과 시간 검증 허용 오차(enter 요청 지연 흡수). 44초 제출은 막고 45초는 통과
  submit-rate-limit-per-sec: 3
```

`.env.example`에 위 3개 환경변수 설명 추가. 실제 값은 커밋 금지.

---

## 6. DB 스키마 (`db/survey/V1__survey_schema.sql`)

원본 스키마에서 바뀐 점: 전 테이블 `sv_` 접두사 / `survey.status`에 `TEST` 추가 / **`sv_page.content JSONB`(동의 화면 구조화 콘텐츠)** / `respondent.attention_failed`, `last_active_at` 추가 / `page_visit.enter_count` 추가 / hold에 `released_at`, `confirmed_at` 추가 / 인덱스 보강. `gen_random_uuid()`는 기존 V1에서 `pgcrypto` 확장이 이미 생성되어 있으므로 사용 가능(PG13+는 기본 내장).

```sql
-- 설문 정의 ------------------------------------------------------------
CREATE TABLE sv_survey (
  id                  BIGSERIAL PRIMARY KEY,
  code                VARCHAR(50)  NOT NULL UNIQUE,              -- URL용
  title               VARCHAR(200) NOT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'TEST',      -- TEST | OPEN | CLOSED
  target_n            INT          NOT NULL,                     -- 500
  stimulus_timer_mode VARCHAR(20)  NOT NULL DEFAULT 'VISIBLE_ONLY', -- WALL_CLOCK | VISIBLE_ONLY (서버 검증 방식)
  redirect_complete   TEXT,                                      -- 패널 리다이렉트, {uid} 치환
  redirect_screenout  TEXT,
  redirect_quotafull  TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE sv_page (
  id                  BIGSERIAL PRIMARY KEY,
  survey_id           BIGINT       NOT NULL REFERENCES sv_survey(id),
  seq                 INT          NOT NULL,
  page_key            VARCHAR(50)  NOT NULL,     -- CSV 열 접미사로 쓰므로 영문 snake_case
  page_type           VARCHAR(20)  NOT NULL,     -- CONSENT | QUESTIONS | STIMULUS | ASSIGN | END
  title               VARCHAR(200) NOT NULL,     -- ProgressHeader 제목
  instruction         TEXT,
  content             JSONB,                     -- CONSENT: {eyebrow, headline, summary, chips[], sections[{heading, body}], agreeLabel}
  min_seconds         INT          NOT NULL DEFAULT 0,
  group_code          VARCHAR(10),               -- NULL=전체, 'A'/'B'=해당 그룹만
  randomize_questions BOOLEAN      NOT NULL DEFAULT false,
  UNIQUE (survey_id, seq),
  UNIQUE (survey_id, page_key)
);

CREATE TABLE sv_stimulus_block (
  id       BIGSERIAL PRIMARY KEY,
  page_id  BIGINT      NOT NULL REFERENCES sv_page(id),
  seq      INT         NOT NULL,
  kind     VARCHAR(10) NOT NULL,                 -- IMAGE | TEXT
  content  TEXT        NOT NULL DEFAULT '',      -- 이미지 경로(/survey/stimuli/...) 또는 본문
  caption  TEXT,                                 -- IMAGE: alt / TEXT: 제목
  UNIQUE (page_id, seq)
);

CREATE TABLE sv_question (
  id                       BIGSERIAL PRIMARY KEY,
  page_id                  BIGINT      NOT NULL REFERENCES sv_page(id),
  seq                      INT         NOT NULL,
  q_no                     VARCHAR(10) NOT NULL,  -- 'Q14', 'Q8-1'
  code                     VARCHAR(20) NOT NULL,  -- 'NOV1' (분석 변수명 = CSV 열 이름)
  text                     TEXT        NOT NULL,
  qtype                    VARCHAR(20) NOT NULL,  -- LIKERT7 | SINGLE | SELECT
  required                 BOOLEAN     NOT NULL DEFAULT true,
  attention_expected_value INT,                   -- Q43: 1
  UNIQUE (page_id, seq)
);
-- 같은 설문 안에서 code 중복 금지는 seed 검증 쿼리로 확인 (page 경유라 단일 UNIQUE 불가)

CREATE TABLE sv_quota (
  id          BIGSERIAL PRIMARY KEY,
  survey_id   BIGINT      NOT NULL REFERENCES sv_survey(id),
  quota_key   VARCHAR(50) NOT NULL,              -- 'GROUP_A','GROUP_B','LIKE','DISLIKE'
  kind        VARCHAR(20) NOT NULL,              -- GROUP | OPTION
  group_code  VARCHAR(10),                       -- kind=GROUP일 때 'A'/'B'
  limit_n     INT         NOT NULL,
  completed_n INT         NOT NULL DEFAULT 0,
  reserved_n  INT         NOT NULL DEFAULT 0,
  on_full     VARCHAR(20) NOT NULL DEFAULT 'DISABLE_OPTION', -- DISABLE_OPTION | QUOTAFULL
  UNIQUE (survey_id, quota_key),
  CHECK (reserved_n >= 0 AND completed_n >= 0),
  CHECK (completed_n + reserved_n <= limit_n)
);

CREATE TABLE sv_question_option (
  id          BIGSERIAL PRIMARY KEY,
  question_id BIGINT       NOT NULL REFERENCES sv_question(id),
  seq         INT          NOT NULL,
  value       INT          NOT NULL,             -- 저장·분석용 숫자
  label       VARCHAR(200) NOT NULL,
  terminates  BOOLEAN      NOT NULL DEFAULT false, -- 선택 시 SCREENOUT
  quota_id    BIGINT       REFERENCES sv_quota(id),
  UNIQUE (question_id, seq),
  UNIQUE (question_id, value)
);

-- 응답 ---------------------------------------------------------------
CREATE TABLE sv_respondent (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id        BIGINT       NOT NULL REFERENCES sv_survey(id),
  panel_uid        VARCHAR(100),                 -- NULL 허용(직접 링크 테스트). NULL끼리는 UNIQUE 충돌 안 함
  status           VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
                   -- IN_PROGRESS | COMPLETE | SCREENOUT | QUOTAFULL | ATTENTION_FAIL | ABANDONED
  group_code       VARCHAR(10),
  assigned_at      TIMESTAMPTZ,
  current_page_seq INT          NOT NULL DEFAULT 1,
  attention_failed BOOLEAN      NOT NULL DEFAULT false,
  consented_at     TIMESTAMPTZ,
  started_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_active_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ,
  user_agent       TEXT,
  ip_hash          VARCHAR(64),                  -- 원본 IP 저장 금지
  UNIQUE (survey_id, panel_uid)
);
CREATE INDEX idx_sv_resp_status ON sv_respondent (survey_id, status);

CREATE TABLE sv_quota_hold (
  respondent_id UUID        NOT NULL REFERENCES sv_respondent(id),
  quota_id      BIGINT      NOT NULL REFERENCES sv_quota(id),
  status        VARCHAR(20) NOT NULL,            -- RESERVED | CONFIRMED | RELEASED
  reserved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  confirmed_at  TIMESTAMPTZ,
  released_at   TIMESTAMPTZ,
  PRIMARY KEY (respondent_id, quota_id)
);
CREATE INDEX idx_sv_hold_expiry ON sv_quota_hold (expires_at) WHERE status = 'RESERVED';

CREATE TABLE sv_answer (
  respondent_id UUID        NOT NULL REFERENCES sv_respondent(id),
  question_id   BIGINT      NOT NULL REFERENCES sv_question(id),
  option_id     BIGINT      NOT NULL REFERENCES sv_question_option(id),
  value         INT         NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_count  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (respondent_id, question_id)
);

CREATE TABLE sv_page_visit (
  id               BIGSERIAL PRIMARY KEY,
  respondent_id    UUID        NOT NULL REFERENCES sv_respondent(id),
  page_id          BIGINT      NOT NULL REFERENCES sv_page(id),
  entered_at       TIMESTAMPTZ NOT NULL DEFAULT now(), -- 최초 enter 시각, 이후 유지
  enter_count      INT         NOT NULL DEFAULT 1,     -- 새로고침/재진입 횟수
  submitted_at     TIMESTAMPTZ,
  server_dwell_ms  BIGINT,
  client_active_ms BIGINT,
  hidden_count     INT         NOT NULL DEFAULT 0,
  blur_count       INT         NOT NULL DEFAULT 0,
  question_order   JSONB,                              -- 실제 제시 순서(question id 배열)
  UNIQUE (respondent_id, page_id)
);
```

---

## 7. 실험 흐름

```
[진입] https://chaenesis.site/s/{code}?uid={패널ID}
  1단계  CONSENT → 스크리닝 Q1~Q3 (terminates 보기 선택 시 SCREENOUT)
  2단계  자극 전 측정 Q4~Q13
  3단계  [ASSIGN: 화면 없음] 그룹 할당(A/B, 쿼터) → 해당 그룹 STIMULUS (≥45초)
         (선택) 첫인상 "마음에 드십니까" — 보기 쿼터 LIKE/DISLIKE
  4단계  Q14~Q38 (신기함 → 도전적 경외감 → 방문 의도 → SNS 공유 의도 → 위협적 경외감 → 지각된 광대함)
  5단계  Q39~Q42 조작 점검 → Q43 주의 점검 → Q44~Q49 인구통계 → END
[종료] 같은 화면에서 EndView — 상태별 문구, redirectUrl 있으면 3초 후 이동
```

- 그룹 할당은 스크리닝 통과 이후 → 탈락자가 그룹 쿼터를 소모하지 않는다.
- ASSIGN 페이지는 렌더하지 않는다. "직전 페이지 submit" 트랜잭션 안에서 다음 seq가 ASSIGN이면 즉시 할당하고 그 다음 표시 가능 페이지를 응답에 담는다.
- 뒤로가기 금지, 새로고침·재접속 시 서버 `current_page_seq`로 복원.
- 재접속: 쿠키 `sv_rid` 또는 동일 `uid` → 이어서 진행. 완료/탈락 uid는 재참여 불가(종료 상태만 반환).
- ATTENTION_FAIL은 응답자에게 COMPLETE와 **같은 화면**을 보여준다(레퍼런스 EndView). 리다이렉트는 D2 결정에 따름.

---

## 8. 핵심 로직

### 8.1 start (`RespondentService.start`) → `CurrentResponse`
1. 설문 조회. 없으면 `SURVEY_NOT_FOUND`, `CLOSED`면 `SURVEY_CLOSED`.
2. 식별 우선순위: ① 쿠키 `sv_rid`가 이 설문의 응답자 → 그 응답자 ② `uid`로 기존 응답자 조회 → 그 응답자(쿠키 재발급) ③ 없으면 신규 생성(`INSERT ... ON CONFLICT (survey_id, panel_uid) DO NOTHING RETURNING id`, 0행이면 재조회 — 동시 첫 접속 경합 대비).
3. 쿠키 uid와 쿼리 uid가 다르면 **쿼리 uid 우선**(패널에서 새로 들어온 경우).
4. 종료 상태면 `{status, redirectUrl}` 반환. `ABANDONED`면 8.5 재개 규칙.
5. `user_agent`, `ip_hash` 기록(신규 생성 시만).
6. 진행 중이면 현재 페이지(`PageFlowService.build`)를 담아 반환 — 프론트는 start 응답만으로 첫 화면을 그린다.

### 8.2 다음 페이지 계산·진행률 (`PageFlowService`)
- `nextSeq`: `seq > current` 중 `group_code`가 NULL이거나 응답자 그룹과 같은 첫 페이지. `ASSIGN` → 8.3 실행 후 다시 계산. `END` → 8.6 종료 처리.
- `totalPages` = 이 응답자에게 보일 CONSENT/QUESTIONS/STIMULUS 페이지 수(그룹 할당 전에는 A 기준으로 계산 — A/B 페이지 수가 같으므로 동일), `progressIndex` = 그중 현재 순번(1부터).
- `build(page)`: 문항(무작위 페이지는 8.9 순서), 보기 `available`(8.4), 자극물 블록, CONSENT면 `content` JSON을 `consent`로.

### 8.3 그룹 할당 (`GroupAssignmentService.assign`)
1. 이미 `group_code`가 있으면 그대로(멱등).
2. `sv_quota(kind=GROUP)` 중 `completed_n + reserved_n < limit_n` 조회.
3. **최소 충원 우선 + 동률 무작위**(`SecureRandom`): `completed_n + reserved_n`이 가장 작은 그룹들 중 무작위. (순수 무작위는 15절 D6에서 선택 가능)
4. 원자적 예약:
   ```sql
   UPDATE sv_quota SET reserved_n = reserved_n + 1
    WHERE id = :id AND completed_n + reserved_n < limit_n
   RETURNING id;
   ```
   0행이면 남은 그룹으로 재시도, 전부 실패하면 `QUOTAFULL` 종료.
5. `sv_quota_hold(RESERVED, expires_at = now() + hold-ttl)`, `group_code`, `assigned_at` 저장. INFO 로그.

### 8.4 보기 쿼터
- 각 보기 `available`: 연결된 쿼터가 `completed_n + reserved_n >= limit_n`이면 false.
- `on_full=DISABLE_OPTION` → 프론트가 회색 + "모집 마감" 배지 + `QuotaNotice` 안내. `QUOTAFULL` → `available=true`로 내려주되 선택·제출 시 QUOTAFULL 종료.
- 제출 시 8.3-4와 같은 원자적 UPDATE로 예약. 경쟁으로 실패하면 `409 QUOTA_FULL` → 프론트 재조회(레퍼런스 동작).

### 8.5 쿼터 확정/해제/만료
- **COMPLETE**: RESERVED hold 전부 → CONFIRMED, 각 쿼터 `reserved_n - 1, completed_n + 1` (한 트랜잭션, 단일 UPDATE로 동시에).
- **SCREENOUT / ATTENTION_FAIL / QUOTAFULL / ABANDONED**: RESERVED → RELEASED, `reserved_n - 1` (5.5절 가드).
- **만료 스케줄러** (`@Scheduled(fixedDelay = 60_000)`): `status='RESERVED' AND expires_at < now()` 를 `FOR UPDATE SKIP LOCKED LIMIT 200`로 가져와 해제, 해당 응답자 `IN_PROGRESS → ABANDONED`.
- **슬라이딩 만료**: submit/enter 때마다 해당 응답자의 RESERVED hold `expires_at = now() + ttl`, `last_active_at = now()` 갱신.
- **ABANDONED 재개**: 돌아오면 `IN_PROGRESS`로 되살리고, 그룹이 있으면 같은 그룹 쿼터 재예약 시도(실패 시 QUOTAFULL). 그룹은 바꾸지 않는다(이미 자극물을 봤을 수 있음).

### 8.6 종료 처리
- END 도달 시 `attention_failed`면 `ATTENTION_FAIL`(쿼터 해제), 아니면 `COMPLETE`(쿼터 확정). `finished_at` 기록.
- `redirectUrl` = 상태별 템플릿의 `{uid}` 치환(URL 인코딩). COMPLETE→`redirect_complete`, SCREENOUT→`redirect_screenout`, QUOTAFULL→`redirect_quotafull`, ATTENTION_FAIL→(D2 결정: 기본 `redirect_complete` — 응답자에게 탈락 사실을 드러내지 않음). 템플릿이 NULL이면 생략.

### 8.7 강제 대기 & 체류 시간
- 프론트는 **모든 페이지** 진입 시 즉시 `POST enter`를 호출한다(레퍼런스). 자극물 타이머는 클라이언트에서 이미지 로딩 완료 후 시작.
- `POST enter`: `INSERT ... ON CONFLICT (respondent_id, page_id) DO UPDATE SET enter_count = sv_page_visit.enter_count + 1 RETURNING entered_at` → `entered_at`은 최초 값 유지(새로고침으로 타이머 리셋 불가). `question_order`도 최초 enter 때 기록.
- `submit` 검증 (min_seconds > 0인 페이지):
  - page_visit 없음 → `422 NOT_ENTERED`
  - `now() - entered_at < min_seconds - tolerance` → `422 TOO_EARLY` + `detail.remainingMs`
  - `VISIBLE_ONLY`이면 추가로 `clientActiveMs < min_seconds*1000 - tolerance` → `422 TOO_EARLY`
- 모든 페이지에서 `submitted_at`, `server_dwell_ms`, `client_active_ms`, `hidden_count`, `blur_count` 저장.

### 8.8 조건부 종료
- `terminates=true` 보기 선택 → 답 저장 후 즉시 `SCREENOUT` (Q1 출생연도 1995~2006 외, Q2·Q3 '아니오').
- `attention_expected_value` 불일치 → `attention_failed=true`. 기본은 끝까지 진행, `survey.attention-fail-immediate=true`면 즉시 `ATTENTION_FAIL`.

### 8.9 문항 순서 무작위화
- `randomize_questions=true` 페이지는 `SeededShuffle(seed = hash(respondentId, pageId))` → 새로고침해도 같은 순서. 실제 순서는 enter 시 `question_order`에 기록.
- 프론트는 받은 순서대로 "1. 2. 3." 번호를 붙여 표시(레퍼런스) → 화면 번호는 `qNo`와 다를 수 있음(의도된 동작).

### 8.10 submit 트랜잭션 순서 (`SubmitService.submit`) → `CurrentResponse`
```
1. respondent FOR UPDATE, 상태 IN_PROGRESS / 설문 OPEN·TEST 확인
2. path seq == current_page_seq 확인 (아니면 409 INVALID_PAGE)
3. 페이지 로드, 그룹 노출 대상인지 확인
4. 대기 시간 검증 (8.7)
5. 답 검증: 필수 누락(MISSING_ANSWER), 보기 소속 불일치(INVALID_OPTION), 그 페이지 외 문항 포함 거부
6. 보기 쿼터 예약 (8.4)
7. sv_answer upsert, CONSENT면 consented_at
8. page_visit 마감
9. terminates → SCREENOUT 종료(쿼터 해제) / 주의 점검 체크
10. nextSeq 계산 (ASSIGN이면 할당, END면 종료 처리)
11. current_page_seq·last_active_at 갱신, hold 만료 연장
12. 응답: 다음 페이지가 담긴 CurrentResponse 또는 {status, redirectUrl}
```

---

## 9. API 명세

모든 응답자 API는 쿠키 `sv_rid`로 식별. Base: `/api/survey`. 성공 응답은 `{ "data": … }`.

| Method | Path | 요청 | 응답 `data` |
|---|---|---|---|
| POST | `/{code}/start` | `{uid: string\|null}` | `CurrentResponse` (+ `Set-Cookie: sv_rid`) |
| GET | `/{code}/current` | — | `CurrentResponse` |
| POST | `/{code}/pages/{seq}/enter` | — | `EnterResponse` |
| POST | `/{code}/pages/{seq}/submit` | `SubmitRequest` | `CurrentResponse` |
| GET | `/admin/{code}/stats` | `X-Admin-Key` | 상태별 인원, 그룹별, 쿼터 현황 |
| GET | `/admin/{code}/export.csv` | `X-Admin-Key`, `?status=COMPLETE` | CSV 파일 |
| POST | `/admin/{code}/status` | `X-Admin-Key`, `{status: TEST\|OPEN\|CLOSED}` | 변경된 상태 |
| POST | `/admin/{code}/reset` | `X-Admin-Key` | **status=TEST일 때만** 응답 데이터 삭제 + 쿼터 카운트 0 |
| GET | `/health` | — | `{ok: true, db: true}` |

### 응답 예시

`POST /api/survey/awe2026/start` `{ "uid": "PANEL123" }` (첫 접속)
```json
{
  "data": {
    "status": "IN_PROGRESS",
    "page": {
      "seq": 1, "pageKey": "consent", "pageType": "CONSENT",
      "title": "연구 참여 안내", "minSeconds": 0,
      "progressIndex": 1, "totalPages": 19,
      "questions": [], "stimulus": [],
      "consent": {
        "eyebrow": "학술 연구 설문",
        "headline": "Z세대 여행자의 자연 관광지 인식 조사",
        "summary": "관광 홍보물을 보고 느낀 생각과 감정을 묻는 설문입니다. …",
        "chips": ["예상 소요 약 10분", "객관식 49문항", "익명 응답"],
        "sections": [{ "heading": "연구 목적", "body": "…" }],
        "agreeLabel": "위 내용을 확인했으며 연구 참여에 동의합니다."
      }
    }
  }
}
```

`POST …/pages/10/submit`
```json
{
  "answers": [ { "questionId": 31, "optionId": 205, "changeCount": 1 } ],
  "clientActiveMs": 18234, "hiddenCount": 0, "blurCount": 1
}
```
→ `{ "data": { "status": "IN_PROGRESS", "page": { "seq": 11, … } } }`
→ 종료 시 `{ "data": { "status": "SCREENOUT", "redirectUrl": "https://panel.example/…?uid=PANEL123" } }`

`POST …/pages/8/enter` → `{ "data": { "enteredAt": "2026-11-01T10:00:00.123Z", "serverNow": "2026-11-01T10:00:00.130Z" } }`

CONSENT 페이지 submit은 `answers: []` — 서버는 CONSENT 페이지 submit 자체를 동의로 간주하고 `consented_at` 기록.

### 에러 (`{code, message, detail?}`)

| code | HTTP | 프론트 처리 (레퍼런스 + 4.4 변경) |
|---|---|---|
| `SURVEY_NOT_FOUND` | 404 | "설문 링크가 올바르지 않습니다." |
| `SURVEY_CLOSED` | 403 | "설문이 종료되었습니다." |
| `RESPONDENT_NOT_FOUND` | 401 | start 재호출 |
| `INVALID_PAGE` | 409 | 토스트 + current 재조회 |
| `QUOTA_FULL` | 409 | 토스트 + current 재조회(마감 반영) |
| `TOO_EARLY` | 422 | 토스트 "홍보물을 조금 더 살펴본 뒤 넘어갈 수 있어요." (`detail.remainingMs`) |
| `NOT_ENTERED` | 422 | enter 후 submit 1회 재시도 |
| `MISSING_ANSWER` | 400 | 토스트 (`detail.questionIds`) |
| `INVALID_OPTION` | 400 | current 재조회 |
| `RATE_LIMITED` | 429 | 1초 후 재시도 |
| `ADMIN_KEY_INVALID` | 403 | — |

> 프론트 `client.ts`는 `credentials: "include"`인데 **401을 받아도 로그인 페이지로 보내면 안 된다** — 기존 `src/api/client.ts`를 쓰지 않는 이유.

---

## 10. Seed (`db/survey/V2__survey_seed.sql`)

### 10.1 페이지 구성

> **실제 적용된 구성은 `docs/survey/questionnaire.md`(20페이지, 보기 쿼터 없음)를 따른다.** 아래 표는 초기 계획안이며 번호가 다르다. `V2`는 화면 확인용 `demo` 설문, `V3`가 실제 연구 설문(`awe2026`)이다.

| seq | page_key | type | title(ProgressHeader) | 내용 | group |
|---|---|---|---|---|---|
| 1 | consent | CONSENT | 연구 참여 안내 | 연구 안내·동의 (`content` JSON) | |
| 2 | screening | QUESTIONS | 기본 정보 확인 | Q1~Q3 (종료 조건) | |
| 3 | pre_travel | QUESTIONS | | Q4~Q5 | |
| 4 | pre_activity | QUESTIONS | | Q6, Q7, Q8-1~Q8-3 | |
| 5 | pre_involve | QUESTIONS | | Q9~Q11 | |
| 6 | pre_media | QUESTIONS | | Q12~Q13 | |
| 7 | assign | ASSIGN | — | 그룹 할당(화면 없음) | |
| 8 | stimulus_a | STIMULUS | 관광 홍보물 보기 | A 자극물, min_seconds=45 | A |
| 9 | stimulus_b | STIMULUS | 관광 홍보물 보기 | B 자극물, min_seconds=45 | B |
| (10) | first_impression | QUESTIONS | 첫인상 | (선택, D4) "마음에 드십니까" — LIKE/DISLIKE 보기 쿼터 | |
| 11 | novelty | QUESTIONS | 방금 본 관광지에 대한 생각 | Q14~Q17 | |
| 12 | awe_1 | QUESTIONS | | Q18~Q20 (도전적 경외감 하위차원 1) | |
| 13 | awe_2 | QUESTIONS | | Q21~Q23 (하위차원 2) | |
| 14 | awe_3 | QUESTIONS | | Q24~Q26 (하위차원 3) | |
| 15 | visit | QUESTIONS | | Q27~Q30 | |
| 16 | share | QUESTIONS | | Q31~Q34 | |
| 17 | threat_vast | QUESTIONS | | Q35~Q38 | |
| 18 | manip | QUESTIONS | | Q39~Q42 | |
| 19 | attention | QUESTIONS | 응답 확인 | Q43 (attention_expected_value=1) | |
| 20 | demo | QUESTIONS | | Q44~Q49 | |
| 21 | end | END | — | | |

- 빈 title은 questionnaire.md의 구성개념명으로 채운다(응답자에게 구성개념이 드러나지 않게 "방금 본 관광지에 대한 생각"처럼 중립 표현 권장).
- 리커트 페이지 `instruction`: "각 문장에 대해 얼마나 동의하는지 1점(전혀 그렇지 않다)부터 7점(매우 그렇다) 중 하나를 골라 주세요."
- 자극물 페이지 `instruction`: "아래 홍보물을 천천히 살펴봐 주세요. 이어지는 문항은 이 홍보물을 바탕으로 답하게 됩니다."
- 경외감 9문항은 모바일 피로도 때문에 3페이지 분할 기본. 하위차원 문항 범위는 questionnaire.md 기준으로 확정.

### 10.2 기타 seed
- 설문: `code='awe2026'`(가칭), `status='TEST'`, `target_n=500`, `stimulus_timer_mode='VISIBLE_ONLY'`.
- 동의 `content`: 레퍼런스 mock의 eyebrow/headline/summary/chips/sections/agreeLabel 구조. "문의"의 연구자 이름·이메일은 실제 값으로.
- 쿼터: `GROUP_A(limit 250)`, `GROUP_B(limit 250)`. LIKE/DISLIKE 보기 쿼터는 D4 확정 후 추가하고 `quota_id` 연결.
- 리커트 보기: 1 전혀 그렇지 않다 / 2 그렇지 않다 / 3 약간 그렇지 않다 / 4 보통이다 / 5 약간 그렇다 / 6 그렇다 / 7 매우 그렇다.
- Q1 출생연도: SELECT, 라벨 `'{연도}년'`, value=연도(최근 연도부터 내림차순, `generate_series`), 1995~2006 외 `terminates=true`.
- Q2·Q3: SINGLE 예(1)/아니오(2), 아니오에 `terminates=true`.
- id 하드코딩 금지 — `(SELECT id FROM sv_page WHERE survey_id=… AND page_key='…')` 서브쿼리로 연결.

### 10.3 개발 중 문구 수정 방법
- `status='TEST'`이고 응답자 0명(또는 reset 후)일 때만: 새 마이그레이션 `V3__survey_seed_fix_xxx.sql`로 UPDATE.
- 오픈(`OPEN`) 이후에는 문항 텍스트/보기 value **변경 금지**(분석 일관성). 꼭 필요하면 변경 이력을 논문 부록용으로 기록.

### 10.4 seed 검증 쿼리 (M5 완료 기준)
```sql
-- 문항 code 중복 없음
SELECT q.code, count(*) FROM sv_question q JOIN sv_page p ON p.id=q.page_id
 WHERE p.survey_id=:sid GROUP BY q.code HAVING count(*)>1;
-- 리커트 문항은 보기 정확히 7개
SELECT q.code FROM sv_question q JOIN sv_question_option o ON o.question_id=q.id
 WHERE q.qtype='LIKERT7' GROUP BY q.code HAVING count(*)<>7;
-- CONSENT 페이지는 content 필수
SELECT page_key FROM sv_page WHERE page_type='CONSENT' AND content IS NULL;
-- 문항 수 = questionnaire.md 기준 개수
```

---

## 11. CSV 내보내기 (wide)

한 행 = 응답자 1명. UTF-8 BOM, `Content-Disposition: attachment; filename="{code}_{yyyyMMdd_HHmm}.csv"`.

```
respondent_id, panel_uid, status, group_code, attention_failed,
started_at, assigned_at, finished_at, total_ms,
<question.code 전부: 페이지 seq → 문항 seq 순>,
dwell_ms_<page_key>, active_ms_<page_key>, hidden_<page_key>, blur_<page_key>, enters_<page_key>  (보인 페이지마다),
stimulus_dwell_ms, stimulus_active_ms, stimulus_hidden   (A/B 중 본 쪽을 하나의 열로 합침)
```
- 열 이름 = `sv_question.code`(SPSS/AMOS/R 바로 사용). 미응답/미노출은 빈 칸.
- 시각은 ISO-8601 (KST, `+09:00`).
- 구현: 문항 목록으로 열 헤더를 먼저 만들고, 응답자를 1,000명 단위로 `answer`/`page_visit` 조회 → 스트리밍 출력(`StreamingResponseBody`).
- `stats` 예시:
  ```json
  { "data": { "status": "OPEN",
    "byStatus": { "IN_PROGRESS": 12, "COMPLETE": 301, "SCREENOUT": 88, "ATTENTION_FAIL": 9, "QUOTAFULL": 0, "ABANDONED": 20 },
    "quotas": [ { "key": "GROUP_A", "limit": 250, "completed": 151, "reserved": 6 } ] } }
  ```
  확인: `curl -H "X-Admin-Key: $KEY" https://api.chaenesis.site/api/survey/admin/awe2026/stats`

---

## 12. 보안·운영·배포

- **관리자 키**: 환경변수 `JOYCRAFT_SURVEY_ADMIN_KEY`(32자 이상 랜덤), `MessageDigest.isEqual` 비교. 미설정 시 관리자 API 비활성.
- **IP**: 원본 미저장, `SHA-256(salt + ip)`만. 프록시 뒤라면 `X-Forwarded-For` 첫 값(신뢰 프록시 설정 확인).
- **개인정보**: 패널 uid 외 수집 안 함. 동의 화면 "자료 사용 범위"에 수집 항목(응답, 체류 시간, 브라우저 정보, IP 해시) 명시.
- **요청 제한**: Caffeine 캐시(이미 의존성 있음)로 `rid`당 초당 submit 3회 초과 시 `429`.
- **로그**: 쿼터 예약/확정/해제, 그룹 할당, 상태 전이를 INFO (`respondentId`, `quotaKey`, 전/후 카운트). 기존 `logback-spring.xml` 사용.
- **배포**
  - API: 기존 GitHub Actions + `deploy.sh` 그대로. 운영 서버 환경변수에 `JOYCRAFT_SURVEY_*` 추가. 첫 기동 시 `sv_flyway_schema_history` 생성 및 V1/V2 적용 로그 확인.
  - Web: `.env.production`에 `VITE_APP_MODE=survey` 후 빌드·배포. 정적 호스팅에 SPA fallback(`try_files $uri /index.html;`)이 있어야 `/s/*` 직접 접근이 됨.
- **백업**: 수집 기간 중 매일 `pg_dump -t 'sv_*' joy_craft > sv_backup_YYYYMMDD.sql`.
- ⚠️ 참고: 현재 API 저장소에 DB 비밀번호·JWT 키·외부 API 키가 들어간 `application-local.yaml`/`application-prod.yaml`이 git에 추적되고 있다. 설문 작업과 별개로 정리 권장(새 설문 키는 절대 yaml에 쓰지 말 것).

---

## 13. 개발 순서 (마일스톤)

각 마일스톤 종료 시: API `./gradlew build` 통과, Web `npm run build` + `npm run lint` + `npm test` 통과.

> **진행 현황 (2026-10-22)**
> | 마일스톤 | 상태 | 비고 |
> |---|---|---|
> | M0 준비 | ⏳ 일부 | ✅ 문항표 수령 → `docs/survey/questionnaire.md` 작성. ❗ Q37·Q38 원문, 연구자 연락처, 자극물 이미지·문구 대기 |
> | M1 화면 이식 | ✅ | 목 모드(`dev:survey-mock`) 동작, 기존 화면 비활성화 |
> | M2 API + 설문 진행 | ✅ | start/current/enter/submit, 쿠키, 설문 전용 Flyway, 실 DB 연결 E2E 통과 |
> | M3 실험 기능 | ✅ | 그룹 할당·그룹 쿼터·45초 서버 검증·체류 시간 기록 |
> | M4 조건부 종료·쿼터 | ✅ | 스크리닝·주의 점검·보기 쿼터·만료 스케줄러·재개·rate limit |
> | M5 데이터 | ✅/⏳ | CSV·stats·status·reset 완료. **실제 문항 seed(code=`awe2026`, V3~V5, 50문항) 적용·검증 완료.** Q37·Q38은 원문이 없어 보류(받으면 새 마이그레이션으로 추가). 문서는 `docs/survey/gen-seed.mjs`로 재생성 |
> | M6 검증·배포 | ⏳ | 자동 테스트 완료. 실기기 확인·운영 env·파일럿 남음 |
> | M7 원복 | 📄 | `docs/survey/drop.sql` 준비 |

### M0 준비 (코드 작성 전)
- [ ] `docs/survey/questionnaire.md` 작성 (문항 번호, 코드, 텍스트, 보기, 종료 조건, 페이지 제목)
- [ ] 자극물 A/B 파일 확보, 동의 화면 문구(연구자 연락처 포함) 확정
- [ ] 15절 결정사항 확정
- [ ] 테스트 DB 방식 결정 (Docker 가능 → Testcontainers / 불가 → 별도 DB `joy_craft_survey_test`)

### M1 화면 이식 + 기존 화면 비활성화 (API 없이 목 모드로 완료)
- 레퍼런스를 `docs/survey/design-reference/`로 복사(node_modules·dist 제외)
- `src/survey/`에 레퍼런스 이식 (4.2), 4.3 호환성 수정, 4.4 변경점 반영
- `main.tsx` 모드 분기(index.css 포함), env 3종, `dev:survey-mock` 스크립트, `vite-env.d.ts`, `CLAUDE.md` 예외 1줄
- 완료 기준: `npm run dev:survey-mock` → `http://localhost:2222/s/demo?uid=test01` 에서 동의→스크리닝→자극물(5초)→문항→종료까지 레퍼런스와 동일하게 보임 / `/dashboard` 등 기존 경로는 NotFound / 기존 모드(`VITE_APP_MODE` 제거)로 기존 앱 정상 / 개발자도구에서 survey 모드 시 Tailwind CSS 미로드 확인

### M2 API 골격 + 설문 진행
- API: `survey` 패키지 골격, `SurveySchemaMigrator`, `V1__survey_schema.sql`, `SurveyProperties`, `SecurityConfig`/`JwtFilter` 1줄씩, `/health`
- start/current/enter/submit (그룹·쿼터·종료 제외), 쿠키, 페이지 정의 캐시, 예외 핸들러, DTO 필드명 4.6과 일치
- 임시 dev seed(`code='dev'`, 레퍼런스 mock과 같은 6페이지)
- 완료 기준: 목 모드 끄고(`npm run dev`) 실제 API로 M1과 같은 흐름 완주, 새로고침/재접속 시 같은 페이지 복원, 다른 seq submit 409, DB에 `sv_*` 10개 + `sv_flyway_schema_history` 생성, 기존 `flyway_schema_history`·기존 API 정상

### M3 실험 기능
- API: `GroupAssignmentService`, `QuotaService`(그룹), enter/대기 검증, page_visit 기록, 진행률 계산
- 완료 기준: 44초 제출 TOO_EARLY / 45초 통과, 새로고침해도 서버 `entered_at` 유지, 그룹별로 다른 자극물·같은 totalPages

### M4 조건부 종료·쿼터
- API: terminates/주의 점검, 보기 쿼터, 확정/해제, `QuotaExpiryScheduler`, 슬라이딩 만료, ABANDONED 재개, 리다이렉트 치환, rate limit
- 완료 기준: 14절 테스트 중 종료/쿼터 항목 통과, 마감 보기가 화면에서 "모집 마감" + QuotaNotice로 표시

### M5 데이터
- `V2__survey_seed.sql` (questionnaire.md 전체), seed 검증 쿼리, CSV export, stats, status/reset 관리자 API
- 완료 기준: CSV를 엑셀/SPSS에서 열어 한글·열 이름 확인

### M6 검증·배포
- 14절 테스트 전부, 실기기 테스트, 파일럿(TEST 상태로 지인 10~20명) → reset → `OPEN`
- 운영 env 설정, 배포, 운영 URL로 1회 완주 후 reset

### M7 수집 종료·원복 (데이터 수집 완료 후)
- 16절 절차

---

## 14. 테스트 계획

> **결정(D8)**: Docker는 쓰지 않는다. API 프로젝트의 DB 접속 정보(local 프로파일)를 그대로 쓰되 `SurveyIntegrationTest`가 기존 데이터를 건드리지 않도록 격리한다(1.4절 3번).
> - ⚠️ `JoycraftApiApplicationTests`(컨텍스트 로드)와 `./gradlew test` 전체 실행은 메인 Flyway를 켠 채 이 DB에 붙으므로 **미커밋 마이그레이션(V25 등)이 적용될 수 있다.** 설문 테스트는 `--tests "com.joycraft.api.survey.*"`로만 돌린다.
> - 600명 동시 접속 테스트는 기본으로 건너뛴다: `./gradlew test --tests "com.joycraft.api.survey.*" -Dsurvey.bigTest=true`
> - 실행 환경: `JAVA_HOME`이 JDK 21을 가리켜야 한다(예: `~/.jdks/corretto-21.0.9`).

### 14.0 구현·실행 결과 (2026-10-22)

| 구분 | 결과 |
|---|---|
| API 통합 테스트 `SurveyIntegrationTest` | **19개 전부 통과** (대규모 600명 포함) |
| 실제 설문 seed `RealSurveySeedTest` (awe2026) | **4개 통과** — 정합성(50문항·코드 중복 없음·리커트 7보기·Q1 종료 범위·ATT=1·쿼터 4개·페이지 번호 연속), 두 그룹 완주(진행률 18페이지 동일), CSV 열 순서, 주의 점검 실패·스크리닝 탈락, 흥미 보기 쿼터 마감 |
| 기존 보안 테스트(`global.security.*`) | 통과(회귀 없음) |
| Web 단위 테스트 (`src/survey`) | 13개 통과 (체류 시간 누적 6, API 클라이언트 7) |
| E2E (실제 API + Vite 프록시, 쿠키) | consent → … → COMPLETE 완주, 자극물 45초 대기·TOO_EARLY, 완료 uid 재진입 차단, 관리자 stats 확인 |
| 기존 웹 테스트 중 실패 | `src/slides/schemaAdapter.test.ts` 53건 — 설문과 무관(슬라이드 스키마, 미커밋 loveflix 작업 영역) |

### API 통합 테스트 (`src/test/java/com/joycraft/api/survey/`)
- [ ] 동시 600건 그룹 할당 → A·B 각각 정확히 250에서 멈춤, 초과 100건 QUOTAFULL, `reserved_n + completed_n <= limit_n` 위반 0
- [ ] 보기 쿼터 경쟁(limit 10에 동시 50건) → 초과 저장 0건
- [ ] 자극물 44초 제출 TOO_EARLY, 45초 통과 (`entered_at`을 직접 과거로 UPDATE해서 검증)
- [ ] enter 2회 호출 시 `entered_at` 불변, `enter_count=2`
- [ ] 스크리닝 불충족 SCREENOUT, 그룹 쿼터 미소모
- [ ] Q43 ≠ 1 → ATTENTION_FAIL, 쿼터 해제
- [ ] 만료 스케줄러: hold `expires_at` 과거 → ABANDONED + 쿼터 반환, 완료 처리와 동시 실행해도 이중 감소 없음
- [ ] 완료자 재접속(같은 uid) 재참여 불가, 다른 브라우저(쿠키 없음)+같은 uid도 동일
- [ ] 동일 응답자 submit 동시 2건 → 1건만 반영
- [ ] 그룹 A 응답자에게 stimulus_b 미노출, 진행률 total 동일
- [ ] 응답 JSON 필드명이 프론트 타입(4.6)과 일치 (스냅샷 테스트)
- [ ] CSV 열 순서·코드명이 seed `code`와 일치, BOM 존재
- [ ] 기존 테스트(`SecurityConfig*Test`) 회귀 없음 + `/api/survey/**` 토큰 없이 200

### Web 단위 테스트 (vitest)
- [ ] `useDwellTracker`: visible/hidden 구간 누적, running=false 동안 미측정
- [ ] `client.ts`: `{data}` 봉투 해제, 에러 `code`/`detail` 매핑, 네트워크 오류 → `NETWORK`
- [ ] QuestionsView: 필수 미응답 시 onSubmit 미호출, changeCount 증가

### 수동·실기기
- [ ] iOS Safari, Android Chrome: 리커트 7점 터치, 하단 버튼이 홈 인디케이터에 안 가림
- [ ] 백그라운드 전환 후 복귀 시 타이머 정지/재개
- [ ] 저속 3G 시뮬레이션에서 이미지 로드 완료 전 타이머 미시작
- [ ] 운영 도메인에서 쿠키 전달(`chaenesis.site` → `api.chaenesis.site`)
- [ ] 데스크톱에서 480px 가운데 정렬, 다크모드 OS에서도 밝은 테마 유지

### 부하 (선택)
- `scripts/survey-load.mjs`(Node fetch)로 500명 완주 시뮬레이션 → stats 수치 일치 확인. **TEST 상태 + reset 전제.**

---

## 15. 결정 필요 사항 (기본값으로 진행 가능)

| # | 항목 | 기본값(권장) | 대안 |
|---|---|---|---|
| D1 | 설문 화면 디자인 | ✅ **확정: `survey-frontend` 레퍼런스 디자인** | — |
| D2 | 패널사 리다이렉트 | 없음(자체 종료 화면) — URL 받으면 seed에 입력. ATTENTION_FAIL은 complete URL로 | 패널사 URL 사용 / ATTENTION_FAIL 별도 URL |
| D3 | 주의 점검 실패 시점 | 끝까지 진행 후 ATTENTION_FAIL (화면은 완료와 동일) | 즉시 종료 |
| D4 | 보기 쿼터 | ✅ **확정: 자극물 사진 직후 "방금 본 사진을 보고 흥미가 있습니까, 없습니까?" (흥미가 있다/없다 각 250명)** — `awe2026` V5. 문항·보기 문구는 임시 표현 | — |
| D5 | 자극물 타이머 | VISIBLE_ONLY (레퍼런스 동작, 탭 보일 때만) | WALL_CLOCK (프론트 수정 필요) |
| D6 | 그룹 할당 | 최소 충원 우선 + 동률 무작위 | 순수 무작위 |
| D7 | uid 없는 접속 | 허용(테스트·직접 링크) | 거부(패널 전용) |
| D8 | 테스트 DB | ✅ **확정: Docker 없이 기존 DB 사용(sv_ 한정·격리, 14절)** | Testcontainers / 별도 DB |
| D9 | 운영 도메인 | 기존 `chaenesis.site` 전체를 설문 모드로 | 별도 서브도메인 |

---

## 16. 수집 종료 후 원복 절차

1. `POST /admin/{code}/status {CLOSED}` → 신규 응답 차단.
2. 최종 CSV(전체 + `status=COMPLETE`) 내려받기, `pg_dump -t 'sv_*'` 백업 → 연구 자료 보관.
3. Web: `VITE_APP_MODE` 제거 → 재배포 (기존 서비스 즉시 복구, `index.css`도 다시 로드됨). 이후 원하면 `src/survey/`, `public/survey/`, `.env.survey-mock`, 스크립트 1줄 삭제.
4. API: `survey` 패키지, `db/survey/`, SecurityConfig/JwtFilter 각 1줄, `survey:` 설정 제거 → 재배포.
5. DB: 백업 확인 후 `docs/survey/drop.sql` 실행
   ```sql
   DROP TABLE IF EXISTS sv_page_visit, sv_answer, sv_quota_hold, sv_respondent,
     sv_question_option, sv_quota, sv_question, sv_stimulus_block, sv_page, sv_survey,
     sv_flyway_schema_history CASCADE;
   ```
   기존 `flyway_schema_history`는 처음부터 건드리지 않았으므로 정리할 것 없음.

---

## 17. 하지 말 것

- 설문 편집 UI, 관리자 대시보드 화면 만들지 말 것
- 주관식 입력 컴포넌트 만들지 말 것
- 쿼터·할당·시간 검증을 프론트에서만 처리하지 말 것
- 문항 텍스트·보기 라벨을 프론트 코드에 하드코딩하지 말 것 (전부 DB. `mock.ts`는 예시 문항만)
- 설문 화면에 JoyCraft Neo 컴포넌트·Tailwind·`index.css` 섞지 말 것 (레퍼런스 `survey.css`만)
- 레퍼런스 동작(타이머, 스크롤 안내, 마감 표시, 종료 문구)을 임의로 바꾸지 말 것 — 4.4절 변경점만
- 기존 테이블에 컬럼/FK 추가, 기존 `db/migration`에 설문 마이그레이션 추가 금지
- `Flyway` 타입 빈 등록 금지 (기존 마이그레이션 자동 설정이 꺼짐 — 5.3절)
- 설문 쪽 JPA 엔티티 생성 금지 (`ddl-auto: validate` 순서 문제)
- 기존 `App.tsx`·기존 페이지·`src/api/client.ts` 수정 금지
- 운영 DB를 가리키는 테스트 프로파일로 동시성/부하 테스트 금지
- 새 비밀값(admin key, salt)을 yaml/코드에 커밋 금지
