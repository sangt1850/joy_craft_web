import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 레이아웃 — 모든 화면의 뼈대라 지연 로딩하지 않는다
import AppLayout from "./components/layout/AppLayout";
import AuthGuard from "./components/auth/AuthGuard";
import ToastContainer from "./components/ui/ToastContainer";

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

const TemplateEditPage = lazy(() => import("./pages/creator/TemplateEditPage"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));

/** 청크를 받아오는 동안 잠깐 보이는 화면 */
function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="font-body text-[13px] text-muted animate-pulse">페이지를 준비하고 있어요…</div>
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
          <Route path="master" element={<AuthGuard requiredRole="MASTER"><MasterDashboardPage /></AuthGuard>} />
          <Route path="master/users" element={<AuthGuard requiredRole="MASTER"><MasterDashboardPage /></AuthGuard>} />
          <Route path="master/sites" element={<AuthGuard requiredRole="MASTER"><MasterDashboardPage /></AuthGuard>} />
          <Route path="master/templates" element={<AuthGuard requiredRole="MASTER"><MasterDashboardPage /></AuthGuard>} />
          <Route path="master/settings" element={<AuthGuard requiredRole="MASTER"><MasterDashboardPage /></AuthGuard>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <ToastContainer />
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

          {/* 크리에이터 슬라이드 기본값 편집기 (풀스크린, CREATOR 전용) */}
          <Route
            path="/creator/templates"
            element={
              <AuthGuard requiredRole="CREATOR">
                <TemplateEditPage />
              </AuthGuard>
            }
          />
          <Route
            path="/creator/templates/:templateId"
            element={
              <AuthGuard requiredRole="CREATOR">
                <TemplateEditPage />
              </AuthGuard>
            }
          />

          {/* 고객용 앱 (fallback) */}
          <Route path="/*" element={<CustomerApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
