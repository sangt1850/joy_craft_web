import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

// 설문 수집 기간에는 기존 서비스 화면을 통째로 내리고 설문 앱만 띄운다.
// index.css(Tailwind preflight·전역 토큰)는 기존 앱 쪽에서만 불러온다.
// 설문 CSS는 .card, html/body 같은 전역 셀렉터를 쓰므로 섞이면 서로 깨진다.
// /fireworks 는 독립 페이지라 설문 모드에서도 그대로 연다 (전역 CSS 없이 인라인 스타일만 사용).
const isFireworks = window.location.pathname.replace(/\/+$/, '') === '/fireworks'

const Root = isFireworks
  ? lazy(() => import('./pages/public/FireworksPage'))
  : import.meta.env.VITE_APP_MODE === 'survey'
    ? lazy(() => import('./survey/SurveyApp'))
    : lazy(() => import('./index.css').then(() => import('./App')))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
