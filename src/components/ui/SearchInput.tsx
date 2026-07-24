// SearchInput — 픽셀 서치 아이콘이 붙은 Neo 스타일 검색 입력창
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
      className={`flex items-center neo-border bg-white px-[14px] py-[9px] gap-2.5 ${className}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <PixelIcon name="search" size={16} fill="#888" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none outline-none bg-transparent font-body text-[14px] text-ink flex-1"
      />
    </div>
  );
}
