// 고객 홈 대시보드
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NeoCard from "../../components/ui/NeoCard";
import NeoButton from "../../components/ui/NeoButton";
import StatCard from "../../components/ui/StatCard";
import SiteCard from "../../components/ui/SiteCard";
import SectionHeader from "../../components/ui/SectionHeader";
import { useAuthStore } from "../../store/authStore";
import { useSiteStore } from "../../store/siteStore";
import { useToastStore } from "../../store/toastStore";
import { createSite } from "../../api/sites";
import { publishSite } from "../../api/editor";

export default function DashboardPage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  // 스토어 액션은 create() 시점에 한 번만 만들어지는 안정된 참조라 의존성에 넣어도 재실행되지 않는다
  const sites = useSiteStore((s) => s.sites);
  const stats = useSiteStore((s) => s.stats);
  const isLoading = useSiteStore((s) => s.isLoading);
  const error = useSiteStore((s) => s.error);
  const loadSites = useSiteStore((s) => s.loadSites);
  const loadStats = useSiteStore((s) => s.loadStats);

  useEffect(() => {
    loadSites();
    loadStats();
  }, [loadSites, loadStats]);

  const handleShare = async (id: string | number) => {
    try {
      const result = await publishSite(String(id));
      const link = window.location.origin + result.url;
      await navigator.clipboard.writeText(link).catch(() => {});
      addToast("링크가 클립보드에 복사되었습니다!", { variant: "success" });
    } catch {
      addToast("공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.", { variant: "error" });
    }
  };

  const handleNewSite = async () => {
    try {
      const site = await createSite("새 사이트");
      navigate(`/editor/${site.id}`);
    } catch {
      navigate("/editor/new");
    }
  };

  const statCards = [
    { label: "내 사이트",   value: String(stats?.totalSites ?? "-"),         bg: "bg-info",    icon: "doc"   as const },
    { label: "공개 사이트", value: String(stats?.publishedSites ?? "-"),      bg: "bg-accent",    icon: "share" as const },
  ];

  const recentSites = sites.slice(0, 3);

  return (
    <div className="px-4 py-7 md:px-8 md:py-9 max-w-[1120px] mx-auto">

      {/* 웰컴 배너 */}
      <div className="mb-7 relative overflow-hidden">
        <NeoCard bg="var(--color-surface)" pad={28} shadow={0}>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[64px] opacity-20 pointer-events-none">
            ❤️
          </div>
          <div className="font-body text-[10px] font-semibold uppercase tracking-[.18em] text-muted mb-2.5">Welcome back</div>
          <h1 className="font-headline text-[28px] m-0 mb-3">
            안녕하세요, {user?.displayName ?? ""}! 👋
          </h1>
          <p className="font-body text-[14px] m-0 mb-5 text-muted leading-[1.6]">
            오늘도 특별한 선물을 만들어보세요.
          </p>
          <NeoButton bg="var(--color-primary)" color="#fff" size="sm" onClick={handleNewSite}>
            + 새 사이트 만들기
          </NeoButton>
        </NeoCard>
      </div>

      {/* 통계 카드 */}
      <div className="neo-grid-sm mb-9">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* 최근 작업 헤더 */}
      <SectionHeader
        title="최근 작업"
        titleSize={20}
        className="mb-4"
        action={
          <button
            onClick={() => navigate("/sites")}
            className="font-sub text-[12px] text-muted bg-transparent border-none cursor-pointer hover:text-heading"
          >
            전체 보기 →
          </button>
        }
      />

      {/* 사이트 카드 그리드 */}
      {isLoading ? (
        <div className="text-center py-12 font-body text-[14px] text-muted">
          불러오는 중...
        </div>
      ) : error ? (
        <NeoCard pad={32} shadow={0} className="text-center">
          <p className="font-body text-[14px] m-0 mb-3 text-muted">
            데이터를 불러오지 못했습니다.
          </p>
          <NeoButton bg="var(--color-secondary)" color="var(--color-ink)" size="sm" onClick={() => { loadSites(); loadStats(); }}>
            다시 시도
          </NeoButton>
        </NeoCard>
      ) : recentSites.length === 0 ? (
        <NeoCard pad={32} shadow={0} className="text-center">
          <p className="font-body text-[14px] m-0 text-muted">
            아직 만든 사이트가 없습니다. 첫 사이트를 만들어보세요!
          </p>
        </NeoCard>
      ) : (
        <div className="neo-grid-md">
          {recentSites.map((s) => (
            <SiteCard
              key={s.id}
              id={s.id}
              title={s.title}
              pages={s.slideCount}
              status={s.status === "PUBLISHED" ? "공개" : "초안"}
              bg={s.bgColor}
              thumbHeight={120}
              onEdit={(id) => navigate(`/editor/${id}`)}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}
