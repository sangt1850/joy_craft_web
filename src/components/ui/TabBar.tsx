// TabBar — 세그먼트 컨트롤 형태의 탭 필터 (MySitesPage, BrowsePage 등)
// 활성 탭: bg-ink text-bg / 비활성: bg-transparent text-ink
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";

const tabVariants = cva(
  "font-sub text-[13px] px-5 py-2 cursor-pointer outline-none border-0 border-r border-r-[2px] border-r-ink",
  {
    variants: {
      active: {
        true:  "bg-ink text-white",
        false: "text-ink hover:bg-ink/[0.06]",
      },
      pos: {
        first:  "",
        middle: "",
        last:   "border-r-0",
        only:   "border-r-0",
      },
    },
    defaultVariants: { active: false, pos: "only" },
  }
);

interface TabBarProps<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: TabBarProps<T>) {
  const getPos = (i: number) => {
    if (tabs.length === 1) return "only" as const;
    if (i === 0)                return "first" as const;
    if (i === tabs.length - 1)  return "last" as const;
    return "middle" as const;
  };

  return (
    <div className={`inline-flex neo-border rounded-[7px] overflow-hidden ${className}`}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          className={cn(tabVariants({ active: active === tab.id, pos: getPos(i) }))}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
