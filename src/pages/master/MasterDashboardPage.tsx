// 관리자 대시보드 — 전체 통계 및 최근 활동 모니터링
import NeoCard from "../../components/ui/NeoCard";
import StatCard from "../../components/ui/StatCard";
import UserRow from "../../components/ui/UserRow";
import SectionHeader from "../../components/ui/SectionHeader";

const MASTER_STATS = [
  { label: "전체 사용자",      value: "1,284", bg: "bg-blue",    icon: "doc"   as const },
  { label: "전체 사이트",      value: "4,712", bg: "bg-mint",    icon: "grid"  as const },
  { label: "오늘 신규가입",    value: "38",    bg: "bg-mustard", icon: "plus"  as const },
  { label: "오늘 생성 사이트", value: "152",   bg: "bg-pink",    icon: "heart" as const },
  { label: "PRO 구독자",       value: "247",   bg: "bg-peach",   icon: "star"  as const },
  { label: "이번 달 매출",     value: "₩2.4M", bg: "bg-cream",   icon: "check" as const },
];

const RECENT_USERS = [
  { name: "김지은", email: "jieun@example.com",   plan: "FREE", joinedAt: "10분 전" },
  { name: "박준혁", email: "junhyuk@example.com", plan: "PRO",  joinedAt: "32분 전" },
  { name: "이수빈", email: "subin@example.com",   plan: "FREE", joinedAt: "1시간 전" },
  { name: "최민준", email: "minjun@example.com",  plan: "PRO",  joinedAt: "2시간 전" },
  { name: "정하은", email: "haeun@example.com",   plan: "FREE", joinedAt: "3시간 전" },
];

export default function MasterDashboardPage() {
  return (
    <div className="px-7 py-8 max-w-[1000px] mx-auto">

      {/* 페이지 헤더 */}
      <div className="mb-7">
        <h1 className="font-headline text-[28px] m-0 mb-1">관리자 대시보드</h1>
        <div className="font-body text-[13px] text-[#666]">2026-07-23 기준</div>
      </div>

      {/* 통계 카드 */}
      <div className="neo-grid-sm mb-9">
        {MASTER_STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* 최근 가입자 */}
      <SectionHeader title="최근 가입자" titleSize={20} className="mb-4" />
      <NeoCard pad={0} shadow={5}>
        {RECENT_USERS.map((user, idx) => (
          <UserRow
            key={user.email}
            {...user}
            meta={user.joinedAt}
            index={idx}
            divider={idx < RECENT_USERS.length - 1}
          />
        ))}
      </NeoCard>
    </div>
  );
}
