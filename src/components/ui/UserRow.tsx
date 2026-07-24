// UserRow — 관리자 사용자 목록 행 (MasterDashboardPage, 향후 UserListPage)
import { cn } from "../../utils/cn";
import StatusBadge, { inferVariant } from "./StatusBadge";

const AVATAR_COLORS = ["bg-blue", "bg-pink", "bg-mint", "bg-mustard", "bg-peach"];

interface UserRowProps {
  name: string;
  email: string;
  plan: string;       // "PRO" | "FREE" 등
  meta?: string;      // 가입일시, 최근접속 등 우측 보조 텍스트
  index?: number;     // 아바타 색상 순환용
  divider?: boolean;  // 하단 구분선 표시 여부
}

export default function UserRow({
  name,
  email,
  plan,
  meta,
  index = 0,
  divider = true,
}: UserRowProps) {
  return (
    <div
      className={cn(
        "flex items-center px-5 py-[14px] gap-4",
        divider && "border-b-[2px] border-black/10"
      )}
    >
      {/* 아바타 */}
      <div
        className={cn(
          "w-9 h-9 neo-border flex items-center justify-center font-headline text-[14px] shrink-0",
          AVATAR_COLORS[index % AVATAR_COLORS.length]
        )}
      >
        {name[0]}
      </div>

      {/* 이름 + 이메일 */}
      <div className="flex-1 min-w-0">
        <div className="font-sub text-[14px] mb-0.5">{name}</div>
        <div className="font-body text-[12px] text-[#666] truncate">{email}</div>
      </div>

      {/* 플랜 배지 */}
      <StatusBadge variant={inferVariant(plan)}>{plan}</StatusBadge>

      {/* 메타 텍스트 */}
      {meta && (
        <div className="font-body text-[11px] text-[#999] shrink-0 w-[70px] text-right">
          {meta}
        </div>
      )}
    </div>
  );
}
