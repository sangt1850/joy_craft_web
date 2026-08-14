// 관리자 대시보드 — 전체 통계 및 최근 활동 모니터링
import { useEffect, useState } from "react";
import NeoCard from "../../components/ui/NeoCard";
import StatCard from "../../components/ui/StatCard";
import UserRow from "../../components/ui/UserRow";
import SectionHeader from "../../components/ui/SectionHeader";
import { fetchPlatformStats, fetchRecentUsers } from "../../api/admin";
import type { PlatformStatsResponse, UserResponse } from "../../types/api";

export default function MasterDashboardPage() {
  const [stats, setStats] = useState<PlatformStatsResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);

  useEffect(() => {
    fetchPlatformStats().then(setStats).catch(() => {});
    fetchRecentUsers().then(setUsers).catch(() => {});
  }, []);

  const statCards = stats
    ? [
        { label: "전체 사용자",      value: stats.totalUsers.toLocaleString(),  bg: "bg-blue",    icon: "doc"   as const },
        { label: "전체 사이트",      value: stats.totalSites.toLocaleString(),  bg: "bg-mint",    icon: "grid"  as const },
        { label: "오늘 신규가입",    value: String(stats.todaySignups),          bg: "bg-mustard", icon: "plus"  as const },
        { label: "오늘 생성 사이트", value: String(stats.todaySites),            bg: "bg-pink",    icon: "heart" as const },
        { label: "PRO 구독자",       value: String(stats.proSubscribers),        bg: "bg-peach",   icon: "star"  as const },
        { label: "이번 달 매출",     value: stats.monthlyRevenue,               bg: "bg-cream",   icon: "check" as const },
      ]
    : [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="px-7 py-8 max-w-[1000px] mx-auto">

      {/* 페이지 헤더 */}
      <div className="mb-7">
        <h1 className="font-headline text-[28px] m-0 mb-1">관리자 대시보드</h1>
        <div className="font-body text-[13px] text-[#666]">{today} 기준</div>
      </div>

      {/* 통계 카드 */}
      <div className="neo-grid-sm mb-9">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* 최근 가입자 */}
      <SectionHeader title="최근 가입자" titleSize={20} className="mb-4" />
      <NeoCard pad={0} shadow={5}>
        {users.map((user, idx) => (
          <UserRow
            key={user.id}
            name={user.displayName}
            email={user.email ?? ""}
            plan={user.role === "MASTER" ? "MASTER" : "FREE"}
            meta={new Date(user.createdAt).toLocaleDateString("ko-KR")}
            index={idx}
            divider={idx < users.length - 1}
          />
        ))}
        {users.length === 0 && (
          <div className="p-6 text-center font-body text-[13px] text-[#888]">
            가입자 없음
          </div>
        )}
      </NeoCard>
    </div>
  );
}
