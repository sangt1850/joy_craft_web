import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, Home, Files, LayoutGrid, Settings, Plus, Search, Layers, ShieldCheck, LayoutDashboard, Users, Shapes } from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/authStore";

interface AppLayoutProps { children: React.ReactNode }
const navMain = [
  { to: "/dashboard", icon: Home, label: "홈" },
  { to: "/sites", icon: Files, label: "내 사이트" },
  { to: "/browse", icon: LayoutGrid, label: "둘러보기" },
];
const navAccount = [{ to: "/settings", icon: Settings, label: "설정" }];
const navItems = [...navMain, ...navAccount];

function Brand() { return <span className="text-[17px] font-semibold tracking-[-.04em] text-heading">JoyCraft</span>; }
function NavItem({ to, icon: Icon, label }: (typeof navItems)[number]) {
  return <NavLink to={to} className="no-underline">{({ isActive }) => (
    <div className={cn("flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm transition-colors", isActive ? "bg-selected text-heading font-semibold" : "text-muted hover:bg-subtle hover:text-heading")}>
      <Icon size={17} strokeWidth={1.8} aria-hidden /><span>{label}</span>
    </div>
  )}</NavLink>;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isCreator = user?.role === "CREATOR";
  const isMaster = user?.role === "MASTER";
  return <div className="flex h-dvh flex-col bg-bg text-ink">
    <header className="hidden h-[64px] shrink-0 items-center justify-between border-b border-border bg-surface px-5 md:flex">
      <div className="flex items-center gap-4">
        <button type="button" aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 열기"} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} className="grid size-9 place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-subtle hover:text-heading"><Menu size={19} /></button>
        <button type="button" onClick={() => navigate("/dashboard")} className="border-0 bg-transparent p-0"><Brand /></button>
        <div className="ml-3 flex h-9 w-[260px] items-center gap-2 rounded-lg border border-border bg-bg px-3 text-muted"><Search size={15} aria-hidden /><span className="text-xs">사이트와 템플릿 검색</span></div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/editor/new")} className="jc-button h-9 rounded-lg bg-primary px-4 text-xs text-white"><Plus size={15} /> 새 사이트</button>
        <div className="grid size-8 place-items-center rounded-full bg-selected text-xs font-semibold text-heading" title={user?.displayName}>{(user?.displayName || "U").slice(0, 1).toUpperCase()}</div>
      </div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className={cn("hidden shrink-0 overflow-hidden border-r border-border bg-[#fcfbfd] transition-[width] duration-200 md:flex md:flex-col", sidebarOpen ? "w-60" : "w-0")}>
        <nav className="flex min-w-60 flex-1 flex-col gap-1 overflow-y-auto p-4">
          <p className="mb-1 mt-2 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Workspace</p>
          {navMain.map((item) => <NavItem key={item.to} {...item} />)}
          {isCreator && (
            <>
              <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Creator</p>
              <NavItem to="/creator/templates" icon={Layers} label="내 슬라이드" />
            </>
          )}
          <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Account</p>
          {navAccount.map((item) => <NavItem key={item.to} {...item} />)}
          {isMaster && (
            <>
              <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Admin</p>
              <NavItem to="/master" icon={LayoutDashboard} label="대시보드" />
              <NavItem to="/master/users" icon={Users} label="사용자" />
              <NavItem to="/master/sites" icon={Files} label="사이트" />
              <NavItem to="/master/templates" icon={Shapes} label="템플릿" />
              <NavItem to="/master/settings" icon={Settings} label="관리 설정" />
            </>
          )}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto pb-[76px] md:pb-0">{children}</main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex h-[68px] border-t border-border bg-surface/95 px-1 backdrop-blur md:hidden">
      {navItems.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} className="flex-1 no-underline">{({ isActive }) => <div className={cn("flex h-full flex-col items-center justify-center gap-1 text-[10px]", isActive ? "text-heading font-semibold" : "text-muted")}><Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} /><span>{label}</span></div>}</NavLink>)}
      {isCreator && (
        <NavLink to="/creator/templates" className="flex-1 no-underline">{({ isActive }) => <div className={cn("flex h-full flex-col items-center justify-center gap-1 text-[10px]", isActive ? "text-heading font-semibold" : "text-muted")}><Layers size={19} strokeWidth={isActive ? 2.2 : 1.7} /><span>슬라이드</span></div>}</NavLink>
      )}
      {isMaster && (
        <NavLink to="/master" className="flex-1 no-underline">{({ isActive }) => <div className={cn("flex h-full flex-col items-center justify-center gap-1 text-[10px]", isActive ? "text-heading font-semibold" : "text-muted")}><ShieldCheck size={19} strokeWidth={isActive ? 2.2 : 1.7} /><span>Admin</span></div>}</NavLink>
      )}
      <button type="button" aria-label="새 사이트 만들기" onClick={() => navigate("/editor/new")} className="m-2 grid size-[48px] shrink-0 place-items-center rounded-[14px] border-0 bg-primary text-white"><Plus size={21} /></button>
    </nav>
  </div>;
}
