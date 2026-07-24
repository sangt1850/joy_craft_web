import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// ─── Variants ────────────────────────────────────────────────────────────────
const buttonVariants = cva(
  [
    "neo-btn",        // CSS: hover/active shadow 처리 (calc 기반)
    "neo-border",     // @utility: 3px solid var(--color-ink)
    "font-sub",       // @theme: Space Grotesk
    "text-center",
    "no-underline",
    "select-none",
  ],
  {
    variants: {
      size: {
        sm: "px-[14px] py-[6px] text-xs",
        md: "px-[22px] py-[10px] text-sm",
        lg: "px-8 py-[14px] text-base",
      },
      block: {
        true:  "block w-full",
        false: "inline-block",
      },
      disabled: {
        true:  "cursor-not-allowed opacity-50",
        false: "cursor-pointer",
      },
    },
    defaultVariants: { size: "md", block: false, disabled: false },
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────
interface NeoButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  shadowColor?: string;
  shadow?: number;
  radius?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NeoButton({
  children,
  bg = "#FF57A6",
  color,
  shadowColor = "#111",
  size = "md",
  shadow = 5,
  radius = 8,
  block = false,
  href,
  onClick,
  className,
  type = "button",
  disabled = false,
}: NeoButtonProps) {
  // 어두운 배경(핑크/블랙)이면 흰색, 밝은 배경이면 검정
  const textColor = color ?? (bg === "#FF57A6" || bg === "#111111" ? "#fff" : "#111");

  // 동적 값만 인라인 style로 주입 — CSS calc()가 --neo-shadow를 참조
  const dynamicStyle = {
    "--neo-shadow":       `${shadow}px`,
    "--neo-shadow-color": shadowColor,
    background:           bg,
    color:                textColor,
    borderRadius:         radius,
  } as React.CSSProperties;

  const classes = cn(buttonVariants({ size, block, disabled }), className);

  if (href) {
    return (
      <a href={href} style={dynamicStyle} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      style={dynamicStyle}
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={!!disabled}
    >
      {children}
    </button>
  );
}
