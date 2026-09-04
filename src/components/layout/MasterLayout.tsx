// 관리자용(Master) 앱 레이아웃
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import PixelIcon from "../ui/PixelIcon";
import { useAuthStore } from "../../store/authStore";

interface MasterLayoutProps {
  children: React.ReactNode;
}

const masterNavItems = [
  { to: "/master",           icon: "home" as const, label: "대시보드", end: true },
  { to: "/master/users",     icon: "doc"  as const, label: "사용자",   end: false },
  { to: "/master/sites",     icon: "grid" as const, label: "사이트",   end: false },
  { to: "/master/templates", icon: "star" as const, label: "템플릿",   end: false },
  { to: "/master/settings",  icon: "gear" as const, label: "설정",     end: false },
];

export default function MasterLayout({ children }: MasterLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  // 서버 세션 삭제까지 끝난 뒤에 이동한다. logout은 실패해도 던지지 않는다.
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">

      {/* 사이드바 */}
      <aside className="w-[220px] min-h-screen bg-ink flex flex-col px-3 py-5 shrink-0">

        {/* 로고 */}
        <div className="flex items-center gap-2 px-3 mb-3">
          <svg width="22" height="20" viewBox="0 0 16 14" style={{ shapeRendering: "crispEdges" }}>
            <rect x="1" y="0" width="4" height="2" fill="#FFC93C" />
            <rect x="6" y="0" width="4" height="2" fill="#FFC93C" />
            <rect x="11" y="0" width="4" height="2" fill="#FFC93C" />
            <rect x="0" y="2" width="16" height="2" fill="#FFC93C" />
            <rect x="0" y="4" width="16" height="2" fill="#FFC93C" />
            <rect x="1" y="6" width="14" height="2" fill="#FFC93C" />
            <rect x="2" y="8" width="12" height="2" fill="#FFC93C" />
            <rect x="3" y="10" width="10" height="2" fill="#FFC93C" />
            <rect x="5" y="12" width="6" height="2" fill="#FFC93C" />
          </svg>
          <div>
            <div className="font-pixel text-base text-bg">JoyCraft</div>
            <div className="font-pixel text-[8px] text-secondary mt-0.5">MASTER</div>
          </div>
        </div>

        <div className="h-[2px] bg-white/10 mx-0 my-4" />

        <nav className="flex flex-col gap-1 flex-1">
          {masterNavItems.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className="no-underline">
              {({ isActive }) => (
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-[9px] rounded-md transition-colors",
                    isActive
                      ? "bg-secondary cursor-default"
                      : "bg-transparent cursor-pointer hover:bg-white/[0.08]"
                  )}
                >
                  <PixelIcon name={icon} size={16} fill={isActive ? "#111" : "#FFF7E6"} />
                  <span
                    className={cn(
                      "font-sub text-[13px]",
                      isActive ? "text-ink" : "text-bg"
                    )}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-[9px] bg-transparent border-none cursor-pointer rounded-md hover:bg-white/[0.08] transition-colors w-full"
        >
          <PixelIcon name="logout" size={16} fill="#9FD3F5" />
          <span className="font-sub text-[13px] text-info">로그아웃</span>
        </button>
      </aside>

      {/* 메인 */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
