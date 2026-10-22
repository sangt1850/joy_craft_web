import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// ─── Variants ────────────────────────────────────────────────────────────────
const buttonVariants = cva(
  [
    "jc-button",
    "font-body",
    "text-center",
    "no-underline",
    "select-none",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-sm",
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
  bg = "var(--color-primary)",
  color,
  shadowColor = "transparent",
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
  const darkBackground = bg.includes("primary") || bg === "#6600ff" || bg === "#111111";
  const textColor = color ?? (darkBackground ? "#fff" : "var(--color-ink)");

  // 동적 값만 인라인 style로 주입 — CSS calc()가 --neo-shadow를 참조
  const dynamicStyle = {
    "--neo-shadow":       `${shadow}px`,
    "--neo-shadow-color": shadowColor,
    background:           bg,
    color:                textColor,
    borderRadius:         Math.min(Math.max(radius, 8), 10),
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
