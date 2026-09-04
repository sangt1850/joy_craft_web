import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 레이아웃 — 모든 화면의 뼈대라 지연 로딩하지 않는다
import AppLayout from "./components/layout/AppLayout";
import MasterLayout from "./components/layout/MasterLayout";
import AuthGuard from "./components/auth/AuthGuard";

// 페이지는 전부 라우트 단위로 쪼갠다.
// 공개 공유 링크(/play/:slug)는 모바일에서 처음 열리는 화면이라 초기 전송량이 곧 첫인상이고,
// 반대로 에디터·관리자 화면은 방문자 대부분이 아예 열지 않는다.
// (슬라이드 18종은 SlideCanvas가 등록하므로 플레이어/에디터 청크에만 실린다)
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const PlayerPage = lazy(() => import("./pages/public/PlayerPage"));
const KakaoCallbackPage = lazy(() => import("./pages/public/KakaoCallbackPage"));

const DashboardPage = lazy(() => import("./pages/customer/DashboardPage"));
const MySitesPage = lazy(() => import("./pages/customer/MySitesPage"));
const BrowsePage = lazy(() => import("./pages/customer/BrowsePage"));
const SettingsPage = lazy(() => import("./pages/customer/SettingsPage"));

const SiteEditorPage = lazy(() => import("./pages/editor/SiteEditorPage"));

const MasterDashboardPage = lazy(() => import("./pages/master/MasterDashboardPage"));

/** 청크를 받아오는 동안 잠깐 보이는 화면 */
function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="font-pixel text-[12px] text-ink animate-pulse">LOADING...</div>
    </div>
  );
}

function CustomerApp() {
  return (
    <AuthGuard>
      <AppLayout>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sites" element={<MySitesPage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </AuthGuard>
  );
}

function MasterApp() {
  return (
    <AuthGuard requiredRole="MASTER">
      <MasterLayout>
        <Routes>
          <Route index element={<MasterDashboardPage />} />
          <Route path="users" element={<MasterDashboardPage />} />
          <Route path="sites" element={<MasterDashboardPage />} />
          <Route path="templates" element={<MasterDashboardPage />} />
          <Route path="settings" element={<MasterDashboardPage />} />
        </Routes>
      </MasterLayout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/play/:slug" element={<PlayerPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />

          {/* 에디터 (레이아웃 없음 — 풀스크린, 인증 필요) */}
          <Route
            path="/editor/:siteId"
            element={
              <AuthGuard>
                <SiteEditorPage />
              </AuthGuard>
            }
          />

          {/* 관리자용 앱 — 와일드카드보다 먼저 매칭 */}
          <Route path="/master/*" element={<MasterApp />} />

          {/* 고객용 앱 (fallback) */}
          <Route path="/*" element={<CustomerApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
