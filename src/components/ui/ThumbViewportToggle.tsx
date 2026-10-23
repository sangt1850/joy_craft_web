export type ThumbViewport = "mobile" | "pc";

interface Props {
  value: ThumbViewport;
  onChange: (v: ThumbViewport) => void;
}

function ViewToggleBtn({
  label,
  orientation,
  active,
  onClick,
  borderLeft,
}: {
  label: string;
  orientation: "landscape" | "portrait";
  active: boolean;
  onClick: () => void;
  borderLeft?: boolean;
}) {
  const color = active ? "var(--color-heading)" : "var(--color-muted)";
  return (
    <button
      onClick={onClick}
      className="font-sub text-[12px] flex items-center gap-1.5 px-3.5 py-2 transition-colors cursor-pointer"
      style={{
        background: active ? "#fff" : "transparent",
        color,
        borderLeft: borderLeft ? "1px solid var(--color-border)" : undefined,
      }}
    >
      {orientation === "landscape" ? (
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke={color} strokeWidth="1.5" />
          <rect x="2" y="2" width="12" height="8" rx="0.5" fill={color} opacity="0.3" />
        </svg>
      ) : (
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
          <rect x="0.5" y="0.5" width="9" height="15" rx="1.5" stroke={color} strokeWidth="1.5" />
          <rect x="3.5" y="1.5" width="3" height="1" rx="0.5" fill={color} opacity="0.5" />
          <rect x="2" y="4" width="6" height="9" rx="0.5" fill={color} opacity="0.3" />
        </svg>
      )}
      {label}
    </button>
  );
}

export default function ThumbViewportToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-[11px] bg-selected p-1 overflow-hidden shrink-0">
      <ViewToggleBtn
        label="PC 보기"
        orientation="landscape"
        active={value === "pc"}
        onClick={() => onChange("pc")}
      />
      <ViewToggleBtn
        label="모바일 보기"
        orientation="portrait"
        active={value === "mobile"}
        onClick={() => onChange("mobile")}
        borderLeft
      />
    </div>
  );
}
