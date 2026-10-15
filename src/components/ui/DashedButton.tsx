// DashedButton — 점선 테두리 추가/액션 버튼 (페이지 추가, 아이템 추가 등)
import PixelIcon from "./PixelIcon";

interface DashedButtonProps {
  children?: React.ReactNode;
  icon?: React.ComponentProps<typeof PixelIcon>["name"];
  onClick?: () => void;
  className?: string;
}

export default function DashedButton({
  children = "추가",
  icon = "plus",
  onClick,
  className = "",
}: DashedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-[38px] border border-dashed border-border-control bg-transparent
        font-sub text-[13px] font-semibold text-muted cursor-pointer rounded-[10px]
        flex items-center justify-center gap-1.5
        hover:bg-info hover:border-primary hover:text-primary transition-colors ${className}`}
    >
      <PixelIcon name={icon} size={12} fill="currentColor" />
      {children}
    </button>
  );
}
