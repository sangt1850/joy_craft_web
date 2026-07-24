import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 레이아웃
import AppLayout from "./components/layout/AppLayout";
import MasterLayout from "./components/layout/MasterLayout";

// public pages
import LandingPage from "./pages/public/LandingPage";
import PlayerPage from "./pages/public/PlayerPage";

// customer pages
import DashboardPage from "./pages/customer/DashboardPage";
import MySitesPage from "./pages/customer/MySitesPage";
import BrowsePage from "./pages/customer/BrowsePage";
import SettingsPage from "./pages/customer/SettingsPage";

// editor pages
import SiteEditorPage from "./pages/editor/SiteEditorPage";

// master pages
import MasterDashboardPage from "./pages/master/MasterDashboardPage";

function CustomerApp() {
  return (
    <AppLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="sites" element={<MySitesPage />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  );
}

function MasterApp() {
  return (
    <MasterLayout>
      <Routes>
        <Route index element={<MasterDashboardPage />} />
        <Route path="users" element={<MasterDashboardPage />} />
        <Route path="sites" element={<MasterDashboardPage />} />
        <Route path="templates" element={<MasterDashboardPage />} />
        <Route path="settings" element={<MasterDashboardPage />} />
      </Routes>
    </MasterLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 페이지 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/play/:siteId" element={<PlayerPage />} />

        {/* 에디터 (레이아웃 없음 — 풀스크린) */}
        <Route path="/editor/:siteId" element={<SiteEditorPage />} />

        {/* 고객용 앱 */}
        <Route path="/*" element={<CustomerApp />} />

        {/* 관리자용 앱 */}
        <Route path="/master/*" element={<MasterApp />} />
      </Routes>
    </BrowserRouter>
  );
}
