// ColorPicker — 색상 스와치 선택기 (SiteEditorPage 버튼 색상 등)
// 선택된 색상: neo-border + 섀도우 / 미선택: 반투명 보더
import { cn } from "../../utils/cn";

interface ColorPickerProps {
  label?: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  swatchSize?: number;
  className?: string;
}

const LABEL_CLASS = "font-sub text-[12px] text-ink mb-1.5 block";

export default function ColorPicker({
  label,
  colors,
  value,
  onChange,
  swatchSize = 28,
  className = "",
}: ColorPickerProps) {
  return (
    <div className={className}>
      {label && <span className={LABEL_CLASS}>{label}</span>}
      <div className="flex gap-2 flex-wrap">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "cursor-pointer border-none p-0",
              value === c ? "neo-border" : "border-[2px] border-black/30"
            )}
            style={{
              background:  c,
              width:       swatchSize,
              height:      swatchSize,
              boxShadow:   value === c ? "2px 2px 0 #111" : "none",
            }}
            aria-label={c}
            aria-pressed={value === c}
          />
        ))}
      </div>
    </div>
  );
}
