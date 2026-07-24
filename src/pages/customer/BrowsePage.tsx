// 페이지 둘러보기 — 템플릿 검색 + 카테고리 필터 + 카드 그리드
import { useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import SearchInput from "../../components/ui/SearchInput";
import TemplateCard from "../../components/ui/TemplateCard";

// 카테고리 pill — rounded-full 스타일로 TabBar와 별도 유지
const pillVariants = cva(
  "font-sub text-[13px] px-4 py-[7px] neo-border rounded-full cursor-pointer transition-colors border-none",
  {
    variants: {
      active: {
        true:  "bg-ink text-cream",
        false: "bg-cream text-ink hover:bg-black/5",
      },
    },
  }
);

const CATEGORIES = ["전체", "생일", "기념일", "고백", "감사", "응원"];

const TEMPLATES = [
  { id: "t1", title: '"나 좋아해?" Q&A', category: "고백",   emoji: "💬", price: "FREE" as const, bg: "bg-mustard" },
  { id: "t2", title: "펼쳐지는 꽃다발",  category: "기념일", emoji: "🌸", price: "FREE" as const, bg: "bg-pink" },
  { id: "t3", title: "열리는 편지지",    category: "감사",   emoji: "💌", price: "FREE" as const, bg: "bg-mint" },
  { id: "t4", title: "사진 갤러리",      category: "생일",   emoji: "🖼️", price: "FREE" as const, bg: "bg-blue" },
  { id: "t5", title: "날짜 타임라인",    category: "기념일", emoji: "📅", price: "PRO"  as const, bg: "bg-peach" },
  { id: "t6", title: "응원 메시지 카드", category: "응원",   emoji: "📣", price: "FREE" as const, bg: "bg-cream" },
  { id: "t7", title: "깜짝 선물 박스",   category: "생일",   emoji: "🎁", price: "PRO"  as const, bg: "bg-mustard" },
  { id: "t8", title: "별자리 지도",      category: "기념일", emoji: "✨", price: "PRO"  as const, bg: "bg-blue" },
];

export default function BrowsePage() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");

  const filtered = TEMPLATES.filter((t) => {
    const matchCat    = category === "전체" || t.category === category;
    const matchSearch = t.title.includes(search) || t.category.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="px-7 py-8 max-w-[960px] mx-auto">
      <h1 className="font-headline text-[28px] m-0 mb-6">페이지 둘러보기</h1>

      {/* 검색창 */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="검색..."
        maxWidth={420}
        className="mb-5"
      />

      {/* 카테고리 pill 필터 */}
      <div className="flex gap-2.5 flex-wrap mb-7">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(pillVariants({ active: category === cat }))}
            style={{
              boxShadow: category === cat ? "3px 3px 0 #555" : "2px 2px 0 #111",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 템플릿 그리드 */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {filtered.map((t) => (
          <TemplateCard key={t.id} {...t} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-[60px] font-body text-[14px] text-[#888]">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
