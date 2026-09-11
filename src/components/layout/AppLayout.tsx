// 고객용 앱 레이아웃
// 데스크탑: 상단 헤더(full-width) + 좌측 사이드바(밝음, 토글 가능) + 메인 콘텐츠
// 모바일: 콘텐츠 + 하단 탭바

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import PixelIcon from "../ui/PixelIcon";
import NeoButton from "../ui/NeoButton";
import SearchInput from "../ui/SearchInput";
import { useAuthStore } from "../../store/authStore";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navMain = [
  { to: "/dashboard", icon: "home" as const, label: "홈" },
  { to: "/sites",     icon: "doc"  as const, label: "내 사이트" },
  { to: "/browse",    icon: "grid" as const, label: "둘러보기" },
];

const navAccount = [
  { to: "/settings", icon: "gear" as const, label: "설정" },
];

const navItems = [...navMain, ...navAccount];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 — 데스크탑 */}
      <header className="hidden md:flex h-14 shrink-0 bg-cream border-b-4 border-ink items-center justify-between px-5 z-50">
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
            onClick={() => navigate("/dashboard")}
            className="bg-transparent border-none cursor-pointer p-0 flex items-center"
          >
            <span className="font-pixel text-[22px] text-ink" style={{ letterSpacing: -0.5 }}>
              JoyCraft
            </span>
          </button>

          {/* 검색 */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="검색..."
            maxWidth={280}
          />
        </div>

        <div className="flex items-center gap-3">
          <NeoButton
            bg="var(--color-pink)"
            color="#fff"
            size="sm"
            onClick={() => navigate("/editor/new")}
          >
            <span className="flex items-center gap-1.5">
              <PixelIcon name="plus" size={12} fill="#fff" />
              새 사이트
            </span>
          </NeoButton>

          {/* 아바타 */}
          <div className="w-8 h-8 rounded-full bg-mustard border-2 border-ink flex items-center justify-center font-pixel text-ink text-xs select-none">
            U
          </div>
        </div>
      </header>

      {/* 바디: 사이드바 + 메인 */}
      <div className="flex flex-1 overflow-hidden">

        {/* 데스크탑 사이드바 */}
        <aside
          className={cn(
            "hidden md:flex flex-col bg-cream border-r-4 border-ink shrink-0",
            "transition-[width] duration-200 overflow-hidden",
            sidebarOpen ? "w-[220px]" : "w-0"
          )}
        >
          <nav className="flex flex-col gap-1 flex-1 p-3 overflow-y-auto min-w-[220px]">
            {/* 메인 그룹 */}
            <p className="font-pixel text-[10px] text-ink/40 px-2 pt-3 pb-1 uppercase">메인</p>
            {navMain.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className="no-underline">
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

            {/* 계정 그룹 */}
            <p className="font-pixel text-[10px] text-ink/40 px-2 pt-4 pb-1 uppercase">계정</p>
            {navAccount.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className="no-underline">
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

          {/* 로그아웃 — 사이드바 하단 고정 */}
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
        <main className="flex-1 overflow-y-auto pb-[72px] md:pb-0">
          {children}
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="flex md:hidden fixed bottom-0 inset-x-0 bg-ink border-t-4 border-ink z-[100]">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className="flex-1 no-underline">
            {({ isActive }) => (
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-2 gap-1",
                  isActive ? "bg-secondary" : "bg-transparent"
                )}
              >
                <PixelIcon name={icon} size={16} fill={isActive ? "#111" : "#FFF7E6"} />
                <span className={cn("font-body text-[10px]", isActive ? "text-ink" : "text-bg")}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        {/* FAB — 새 사이트 */}
        <button
          onClick={() => navigate("/editor/new")}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 bg-primary border-none cursor-pointer"
        >
          <PixelIcon name="plus" size={16} fill="#fff" />
          <span className="font-body text-[10px] text-white">만들기</span>
        </button>
      </nav>
    </div>
  );
}
