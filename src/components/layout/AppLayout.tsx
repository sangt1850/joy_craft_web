// 고객용 앱 레이아웃
// 데스크탑: 좌측 사이드바(240px) + 메인 콘텐츠
// 모바일: 콘텐츠 + 하단 탭바

import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import PixelIcon from "../ui/PixelIcon";
import NeoButton from "../ui/NeoButton";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: "/dashboard", icon: "home" as const, label: "홈" },
  { to: "/sites",     icon: "doc"  as const, label: "내 사이트" },
  { to: "/browse",    icon: "grid" as const, label: "둘러보기" },
  { to: "/settings",  icon: "gear" as const, label: "설정" },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-cream">

      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex w-[240px] min-h-screen bg-ink border-r-[4px] border-ink flex-col px-4 py-6 shrink-0">

        {/* 로고 */}
        <button
          className="flex items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer p-0"
          onClick={() => navigate("/dashboard")}
        >
          <span className="font-pixel text-[32px] text-cream" style={{ letterSpacing: -0.5 }}>
            JoyCraft
          </span>
        </button>

        {/* 네비게이션 */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className="no-underline">
              {({ isActive }) => (
                <div
                  className={cn(
                    "flex items-center gap-3 px-[14px] py-[10px] rounded-lg border-2 transition-colors",
                    isActive
                      ? "bg-mustard border-mustard text-ink cursor-default"
                      : "bg-transparent border-transparent text-cream cursor-pointer hover:bg-white/[0.08]"
                  )}
                >
                  <PixelIcon name={icon} size={18} fill={isActive ? "#111" : "#FFF7E6"} />
                  <span className="font-sub text-sm">
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 새 사이트 버튼 */}
        <div className="mb-4">
          <NeoButton bg="#FF57A6" block onClick={() => navigate("/editor/new")}>
            + 새 사이트
          </NeoButton>
        </div>

        {/* 로그아웃 */}
        <button
          className="flex items-center gap-2.5 px-[14px] py-[10px] bg-transparent border-none cursor-pointer rounded-lg hover:bg-white/[0.08] transition-colors w-full"
        >
          <PixelIcon name="logout" size={18} fill="#9FD3F5" />
          <span className="font-sub text-sm text-blue">
            로그아웃
          </span>
        </button>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto pb-[72px] md:pb-0">
        {children}
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="flex md:hidden fixed bottom-0 inset-x-0 bg-ink border-t-[4px] border-ink z-[100]">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className="flex-1 no-underline">
            {({ isActive }) => (
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-2 gap-1",
                  isActive ? "bg-mustard" : "bg-transparent"
                )}
              >
                <PixelIcon name={icon} size={16} fill={isActive ? "#111" : "#FFF7E6"} />
                <span
                  className={cn(
                    "font-body text-[10px]",
                    isActive ? "text-ink" : "text-cream"
                  )}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        {/* FAB — 새 사이트 */}
        <button
          onClick={() => navigate("/editor/new")}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 bg-pink border-none cursor-pointer"
        >
          <PixelIcon name="plus" size={16} fill="#fff" />
          <span className="font-body text-[10px] text-white">만들기</span>
        </button>
      </nav>
    </div>
  );
}
