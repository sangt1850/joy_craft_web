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
      className={`w-full py-[9px] border-[3px] border-dashed border-black/35 bg-transparent
        font-sub text-[12px] text-[#555] cursor-pointer rounded-md
        flex items-center justify-center gap-1.5
        hover:border-black/60 hover:text-ink transition-colors ${className}`}
    >
      <PixelIcon name={icon} size={12} fill="#555" />
      {children}
    </button>
  );
}
