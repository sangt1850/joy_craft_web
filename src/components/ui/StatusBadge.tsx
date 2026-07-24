// StatusBadge — 공개/초안/PRO/FREE 상태를 표시하는 픽셀 배지
// pixel-badge, pixel-badge-muted, pixel-badge-pro 유틸리티를 props로 선택

type StatusBadgeVariant = "default" | "muted" | "pro";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
  className?: string;
}

const variantClass: Record<StatusBadgeVariant, string> = {
  default: "pixel-badge",
  muted:   "pixel-badge-muted",
  pro:     "pixel-badge-pro",
};

// 공개/PRO → default, 초안/FREE → muted 자동 감지 헬퍼
export function inferVariant(status: string): StatusBadgeVariant {
  if (status === "PRO")              return "pro";
  if (status === "공개" || status === "PUBLIC") return "default";
  return "muted";
}

export default function StatusBadge({
  children,
  variant = "muted",
  className = "",
}: StatusBadgeProps) {
  return (
    <span className={`${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}
