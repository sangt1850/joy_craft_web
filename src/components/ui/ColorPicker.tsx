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

const LABEL_CLASS = "font-sub text-[10px] text-[#8b7f93] mb-[7px] block";

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
              "cursor-pointer p-0 rounded-lg border",
              value === c ? "border-secondary ring-2 ring-secondary/20" : "border-border"
            )}
            style={{
              background:  c,
              width:       swatchSize,
              height:      swatchSize,
            }}
            aria-label={c}
            aria-pressed={value === c}
          />
        ))}
      </div>
    </div>
  );
}
