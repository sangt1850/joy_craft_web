// SearchInput — 서비스 전역 검색 입력창
import PixelIcon from "./PixelIcon";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWidth?: number | string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "검색...",
  maxWidth,
  className = "",
}: SearchInputProps) {
  return (
    <div
      className={`jc-search flex items-center bg-white px-3 py-2 gap-2.5 ${className}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <PixelIcon name="search" size={16} fill="var(--color-muted)" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none outline-none bg-transparent font-body text-[14px] text-ink flex-1 min-w-0"
      />
    </div>
  );
}
