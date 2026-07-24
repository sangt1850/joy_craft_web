// ToggleSwitch — Neo Brutalism 스타일 토글 스위치
// SiteEditorPage 등에서 반복되는 on/off 토글 패턴
import { cn } from "../../utils/cn";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export default function ToggleSwitch({
  label,
  checked,
  onChange,
  className = "",
}: ToggleSwitchProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between cursor-pointer font-sub text-[13px] text-ink",
        className
      )}
    >
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "w-10 h-[22px] border-2 border-ink rounded-[11px] cursor-pointer relative transition-colors",
          checked ? "bg-ink" : "bg-black/15"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-[14px] h-[14px] border border-ink rounded-full transition-[left]",
            checked ? "bg-mustard" : "bg-[#888]"
          )}
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
    </label>
  );
}
