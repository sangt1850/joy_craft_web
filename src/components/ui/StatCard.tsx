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
  bg = "bg-info",
  iconFill = "#111",
}: StatCardProps) {
  return (
    <div
      className={`neo-border p-5 ${bg}`}
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <PixelIcon name={icon} size={18} fill={iconFill} />
        <span className="font-pixel text-[18px] text-ink">{value}</span>
      </div>
      <div className="font-sub text-[13px] text-ink">{label}</div>
    </div>
  );
}
