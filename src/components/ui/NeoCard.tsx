import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// ─── Variants ────────────────────────────────────────────────────────────────
const cardVariants = cva("", {
  variants: {
    flex: {
      true:  "flex",
      false: "block",
    },
    dir: {
      row:    "flex-row",
      column: "flex-col",
    },
    clip: {
      true:  "overflow-hidden",
      false: "",
    },
    lift: {
      // .neo-card-lift: CSS :hover로 translateY + shadow — useState 불필요
      true:  "neo-card-lift",
      false: "",
    },
    clickable: {
      true:  "cursor-pointer",
      false: "",
    },
  },
  defaultVariants: { flex: false, dir: "column", clip: false, lift: false, clickable: false },
});

// ─── Types ───────────────────────────────────────────────────────────────────
interface NeoCardProps extends VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  bg?: string;
  shadowColor?: string;
  pad?: number;
  shadow?: number;
  border?: number;
  radius?: number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NeoCard({
  children,
  bg = "#FFF7E6",
  shadowColor = "#111",
  pad = 22,
  shadow = 6,
  border = 4,
  radius = 0,
  clip = false,
  lift = false,
  flex = false,
  dir = "column",
  gap = 12,
  className,
  style,
  onClick,
}: NeoCardProps) {
  // 동적 숫자/색상 값만 인라인 style로 주입
  // border는 var(--color-ink) 참조 → 테마 변경 시 자동 반응
  const dynamicStyle = {
    "--neo-shadow":       `${shadow}px`,
    "--neo-shadow-color": shadowColor,
    background:           bg,
    border:               `${border}px solid var(--color-ink)`,
    padding:              pad,
    borderRadius:         radius,
    gap:                  flex ? gap : undefined,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      style={dynamicStyle}
      className={cn(cardVariants({ flex, dir, clip, lift, clickable: !!onClick }), className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
