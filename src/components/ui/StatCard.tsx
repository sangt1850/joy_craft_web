// StatCard — 숫자/수치를 표시하는 통계 카드
// DashboardPage, MasterDashboardPage의 반복 패턴 추상화
import PixelIcon from "./PixelIcon";

type IconName = React.ComponentProps<typeof PixelIcon>["name"];

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconName;
  bg?: string;           // Tailwind 클래스 (e.g. "bg-info") 또는 CSS 변수
  iconFill?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  iconFill = "var(--color-secondary)",
}: StatCardProps) {
  return (
    <div
      className="rounded-[13px] border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <PixelIcon name={icon} size={18} fill={iconFill} />
        <span className="font-body text-[24px] font-semibold tracking-[-.04em] text-heading tabular-nums">{value}</span>
      </div>
      <div className="font-body text-[12px] text-muted">{label}</div>
    </div>
  );
}
