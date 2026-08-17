# JoyCraft Web

컴포넌트 단위 슬라이드를 조합해 만드는 인터랙티브 이벤트 사이트 플랫폼 — React 프론트엔드.

## 기술 스택

- Vite 8 + React 19 + TypeScript 6
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion + GSAP
- Zustand (상태 관리)
- react-router-dom v7
- @dnd-kit (에디터 슬라이드 순서 변경)
- lucide-react (`PixelIcon` 내부 아이콘 소스)
- Vitest (유닛 테스트)
- oxlint (린트)

> `vite-plugin-pwa`는 설치되어 있으나 `vite.config.ts`에 등록되지 않아 사용되지 않는다.

## 폴더 구조

```
src/
├── api/                  # 백엔드 API 클라이언트
│   ├── client.ts         # fetch 래퍼. api(인증) / publicApi(skipAuth) 두 가지
│   ├── auth.ts           # 로그인·회원가입·카카오·GET /me
│   ├── sites.ts          # 내 사이트 목록/통계/생성/삭제
│   ├── editor.ts         # 사이트 상세·슬라이드 CRUD·순서변경·발행
│   ├── templates.ts      # 템플릿 browse / categories
│   └── play.ts           # 공개 발행 스냅샷 + flowPolicy 정규화
├── components/
│   ├── auth/AuthGuard.tsx        # 인증·역할 가드
│   ├── layout/                   # AppLayout(고객) / MasterLayout(관리자)
│   ├── editor/                   # SlideList, SlideFieldsPanel, TemplatePickerModal
│   │   └── fields/               # FieldWidget, ArrayFieldEditor, numberField
│   ├── player/                   # SlideCanvas, SlideErrorBoundary
│   └── ui/                       # 디자인 시스템 컴포넌트(NeoButton, NeoCard 등)
├── pages/
│   ├── public/           # LandingPage, PlayerPage, KakaoCallbackPage
│   ├── customer/         # Dashboard, MySites, Browse, Settings
│   ├── editor/           # SiteEditorPage
│   └── master/           # MasterDashboardPage
├── slides/               # 슬라이드 컴포넌트 18종 (폴더당 Component/schema/index)
│   ├── registry.ts       # componentRef → React 컴포넌트 매핑
│   ├── SlideProps.ts     # 슬라이드 공통 props·스키마 타입
│   ├── schemaAdapter.ts  # 서버 스키마(field.kind) → 로컬 스키마(type) 어댑터
│   └── index.ts          # 18종 side-effect import (App.tsx가 이 파일을 import)
├── store/                # Zustand: authStore, siteStore, editorStore, themeStore
├── types/api.ts          # 백엔드 응답 타입
├── utils/cn.ts           # clsx 래퍼
└── index.css             # 디자인 토큰, @utility 정의
```

> `src/editor/`, `src/player/`는 `.gitkeep`만 있는 빈 디렉토리다(사용하지 않음).
> 실제 에디터/플레이어 코드는 `pages/`·`components/` 아래에 있다.

## 라우팅

| 경로 | 화면 | 인증 |
|------|------|------|
| `/` | 랜딩 | 공개 |
| `/play/:slug` | 발행된 사이트 플레이어 | 공개 |
| `/auth/kakao/callback` | 카카오 로그인 콜백 | 공개 |
| `/editor/:siteId` | 사이트 에디터 (풀스크린, 레이아웃 없음) | 필요 |
| `/dashboard` `/sites` `/browse` `/settings` | 고객 앱 (`AppLayout`) | 필요 |
| `/master/*` | 관리자 앱 (`MasterLayout`) | MASTER |

> `/master` 하위 `users`/`sites`/`templates`/`settings`는 현재 모두
> `MasterDashboardPage`를 렌더링한다(개별 화면 미구현).

## 백엔드 연동

- API 베이스 경로는 `/api`이며, 개발 시 Vite 프록시가 `http://localhost:8080`으로 전달한다(`vite.config.ts`).
- 응답은 `{ data: T }` 봉투로 감싸진다. 예외적으로 `GET /api/play/{slug}`는 스냅샷을 그대로 반환한다.
- 인증은 `localStorage.accessToken` → `Authorization: Bearer` 헤더.
  공개 엔드포인트는 `publicApi`(`skipAuth`)를 사용해 401이 와도 로그아웃/리다이렉트하지 않는다.

## 미구현

- CREATOR 관련 기능 전부 (웹 IDE, 컴포넌트 심사 워크플로) — 코드 없음
- 이미지 업로드 (백엔드 asset 도메인 미구현. 에디터는 URL 직접 입력)
- PRO 구독 / 결제 — 배지 표시만 있고 실제 제한 없음
- `platformMode` 분기 렌더링

## 실행

```bash
# 개발 서버
npm run dev

# 빌드 (tsc -b && vite build)
npm run build

# 린트
npm run lint

# 테스트
npm test

# 빌드 미리보기
npm run preview
```

## 관련 저장소

- `joy_craft_api` — Spring Boot 백엔드
