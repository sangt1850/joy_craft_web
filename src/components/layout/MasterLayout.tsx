// 관리자용(Master) 앱 레이아웃
// 데스크탑: 상단 헤더(full-width) + 좌측 사이드바(밝음, 토글 가능) + 메인 콘텐츠

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import PixelIcon from "../ui/PixelIcon";
import { useAuthStore } from "../../store/authStore";

interface MasterLayoutProps {
  children: React.ReactNode;
}

const navManage = [
  { to: "/master",           icon: "home" as const, label: "대시보드", end: true  },
  { to: "/master/users",     icon: "doc"  as const, label: "사용자",   end: false },
  { to: "/master/sites",     icon: "grid" as const, label: "사이트",   end: false },
  { to: "/master/templates", icon: "star" as const, label: "템플릿",   end: false },
];

const navSystem = [
  { to: "/master/settings", icon: "gear" as const, label: "설정", end: false },
];

export default function MasterLayout({ children }: MasterLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 */}
      <header className="flex h-14 shrink-0 bg-cream border-b-4 border-ink items-center justify-between px-5 z-50">
        <div className="flex items-center gap-4">
          {/* 햄버거 토글 */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center rounded hover:bg-ink/10 transition-colors"
          >
            <PixelIcon name="menu" size={20} fill="#111" />
          </button>

          {/* 로고 */}
          <button
            onClick={() => navigate("/master")}
            className="bg-transparent border-none cursor-pointer p-0 flex items-center gap-2"
          >
            <span className="font-pixel text-[22px] text-ink" style={{ letterSpacing: -0.5 }}>
              JoyCraft
            </span>
            <span className="pixel-badge text-[9px] px-1.5 py-0.5">MASTER</span>
          </button>
        </div>

        {/* 아바타 */}
        <div className="w-8 h-8 rounded-full bg-mustard border-2 border-ink flex items-center justify-center font-pixel text-ink text-xs select-none">
          M
        </div>
      </header>

      {/* 바디: 사이드바 + 메인 */}
      <div className="flex flex-1 overflow-hidden">

        {/* 사이드바 */}
        <aside
          className={cn(
            "flex flex-col bg-cream border-r-4 border-ink shrink-0",
            "transition-[width] duration-200 overflow-hidden",
            sidebarOpen ? "w-[220px]" : "w-0"
          )}
        >
          <nav className="flex flex-col gap-1 flex-1 p-3 overflow-y-auto min-w-[220px]">
            {/* 관리 그룹 */}
            <p className="font-pixel text-[10px] text-ink/40 px-2 pt-3 pb-1 uppercase">관리</p>
            {navManage.map(({ to, icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className="no-underline">
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-[9px] rounded-md border-2 transition-colors",
                      isActive
                        ? "bg-secondary border-ink neo-shadow-sm cursor-default"
                        : "bg-transparent border-transparent cursor-pointer hover:bg-mustard/20"
                    )}
                  >
                    <PixelIcon name={icon} size={16} fill="#111" />
                    <span className="font-sub text-sm text-ink">{label}</span>
                  </div>
                )}
              </NavLink>
            ))}

            {/* 시스템 그룹 */}
            <p className="font-pixel text-[10px] text-ink/40 px-2 pt-4 pb-1 uppercase">시스템</p>
            {navSystem.map(({ to, icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className="no-underline">
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-[9px] rounded-md border-2 transition-colors",
                      isActive
                        ? "bg-secondary border-ink neo-shadow-sm cursor-default"
                        : "bg-transparent border-transparent cursor-pointer hover:bg-mustard/20"
                    )}
                  >
                    <PixelIcon name={icon} size={16} fill="#111" />
                    <span className="font-sub text-sm text-ink">{label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 로그아웃 — 하단 고정 */}
          <div className="p-3 min-w-[220px] border-t-2 border-ink/20">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-[9px] bg-transparent border-none cursor-pointer rounded-md hover:bg-ink/10 transition-colors w-full"
            >
              <PixelIcon name="logout" size={16} fill="#111" />
              <span className="font-sub text-sm text-ink">로그아웃</span>
            </button>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
