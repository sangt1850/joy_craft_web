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
        "flex items-center justify-between cursor-pointer font-sub text-[10px] text-[#8b7f93]",
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
          "w-10 h-[22px] border border-border-control rounded-[11px] cursor-pointer relative transition-colors",
          checked ? "bg-secondary" : "bg-selected"
        )}
      >
        <div
          className={cn(
            "absolute top-[3px] w-[14px] h-[14px] rounded-full transition-[left]",
            checked ? "bg-white" : "bg-muted"
          )}
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
    </label>
  );
}
