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
import { createSite } from "../../api/sites";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sites, stats, loadSites, loadStats } = useSiteStore();

  useEffect(() => {
    loadSites();
    loadStats();
  }, []);

  const handleNewSite = async () => {
    try {
      const site = await createSite("새 사이트");
      navigate(`/editor/${site.id}`);
    } catch {
      navigate("/editor/new");
    }
  };

  const statCards = [
    { label: "내 사이트",   value: String(stats?.totalSites ?? "-"),         bg: "bg-blue",    icon: "doc"   as const },
    { label: "받은 하트",   value: String(stats?.totalHearts ?? "-"),         bg: "bg-pink",    icon: "heart" as const },
    { label: "공개 사이트", value: String(stats?.publishedSites ?? "-"),      bg: "bg-mint",    icon: "share" as const },
    { label: "무료 체험",   value: stats ? `D-${stats.trialDaysLeft}` : "-",  bg: "bg-mustard", icon: "clock" as const },
  ];

  const recentSites = sites.slice(0, 3);

  return (
    <div className="px-7 py-8 max-w-[900px] mx-auto">

      {/* 웰컴 배너 */}
      <div className="mb-7 relative overflow-hidden">
        <NeoCard bg="var(--color-mustard)" pad={28} shadow={6}>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[64px] opacity-20 pointer-events-none">
            ❤️
          </div>
          <div className="font-pixel text-[28px] text-ink opacity-60 mb-2.5">WELCOME BACK</div>
          <h1 className="font-headline text-[28px] m-0 mb-3">
            안녕하세요, {user?.displayName ?? ""}! 👋
          </h1>
          <p className="font-body text-[14px] m-0 mb-5 text-[#333] leading-[1.6]">
            오늘도 특별한 선물을 만들어보세요.
          </p>
          <NeoButton bg="#111" color="#FFF7E6" size="sm" onClick={handleNewSite}>
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
            className="font-sub text-[13px] text-ink bg-transparent border-none cursor-pointer underline"
          >
            전체 보기 →
          </button>
        }
      />

      {/* 사이트 카드 그리드 */}
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
          />
        ))}
      </div>
    </div>
  );
}
