// 관리자 대시보드 — 전체 통계 및 최근 활동 모니터링
import { useEffect, useState } from "react";
import NeoCard from "../../components/ui/NeoCard";
import NeoButton from "../../components/ui/NeoButton";
import StatCard from "../../components/ui/StatCard";
import UserRow from "../../components/ui/UserRow";
import SectionHeader from "../../components/ui/SectionHeader";
import { fetchPlatformStats, fetchRecentUsers } from "../../api/admin";
import type { PlatformStatsResponse, UserResponse } from "../../types/api";
import { todayISO } from "../../utils/date";

export default function MasterDashboardPage() {
  const [stats, setStats] = useState<PlatformStatsResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetchPlatformStats().then(setStats),
      fetchRecentUsers().then(setUsers),
    ])
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = stats
    ? [
        { label: "전체 사용자",      value: stats.totalUsers.toLocaleString(),  bg: "bg-info",    icon: "doc"   as const },
        { label: "전체 사이트",      value: stats.totalSites.toLocaleString(),  bg: "bg-accent",    icon: "grid"  as const },
        { label: "오늘 신규가입",    value: String(stats.todaySignups),          bg: "bg-secondary", icon: "plus"  as const },
        { label: "오늘 생성 사이트", value: String(stats.todaySites),            bg: "bg-primary",    icon: "heart" as const },
      ]
    : [];

  const today = todayISO();

  return (
    <div className="px-4 py-7 md:px-8 md:py-9 max-w-[1120px] mx-auto">

      {/* 페이지 헤더 */}
      <div className="mb-7">
        <h1 className="font-headline text-[28px] m-0 mb-1">관리자 대시보드</h1>
        <div className="font-body text-[12px] text-muted">{today} 기준</div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-body text-[14px] text-muted">
          불러오는 중…
        </div>
      ) : error ? (
        <NeoCard pad={32} shadow={0} className="text-center">
          <p className="font-body text-[14px] m-0 mb-3 text-muted">
            데이터를 불러오지 못했습니다.
          </p>
          <NeoButton bg="var(--color-secondary)" color="var(--color-ink)" size="sm" onClick={loadData}>
            다시 시도
          </NeoButton>
        </NeoCard>
      ) : (
        <>
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
              <div className="p-6 text-center font-body text-[13px] text-muted">
                가입자 없음
              </div>
            )}
          </NeoCard>
        </>
      )}
    </div>
  );
}
