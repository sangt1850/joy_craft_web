# JoyCraft Web

컴포넌트 단위 슬라이드를 조합해 만드는 인터랙티브 이벤트 사이트 플랫폼 — React 프론트엔드.

## 기술 스택

- Vite + React 18 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion + GSAP
- @dnd-kit (drag & drop)
- Zustand (상태 관리)
- react-router-dom

## 폴더 구조

```
src/
├── components/      # 공용 UI 컴포넌트
├── slides/          # 슬라이드 컴포넌트
│   └── registry.ts  # componentRef → React 컴포넌트 매핑
├── editor/          # CUSTOMER용 사이트 에디터 (미구현)
├── player/          # 사이트 재생 뷰어 (미구현)
├── store/           # Zustand 스토어
├── types/           # 도메인 타입 정의
│   └── index.ts
├── api/             # 백엔드 API 클라이언트 (미구현)
└── utils/
```

## 라우팅

| 경로 | 설명 |
|------|------|
| `/` | 홈 |
| `/editor` | 사이트 에디터 |
| `/play/:siteId` | 사이트 플레이어 |

## 실행

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 관련 저장소

- `joycraft-api` — Spring Boot 백엔드
