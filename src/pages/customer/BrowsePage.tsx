// 페이지 둘러보기 — 템플릿 검색 + 카테고리 필터 + 카드 그리드
import { useState, useEffect } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import SearchInput from "../../components/ui/SearchInput";
import TemplateCard from "../../components/ui/TemplateCard";
import TemplatePreviewModal from "../../components/ui/TemplatePreviewModal";
import { fetchTemplates, fetchCategories } from "../../api/templates";
import type { TemplateListResponse } from "../../types/api";

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

const BG_COLORS = ["bg-mustard", "bg-pink", "bg-mint", "bg-blue", "bg-peach", "bg-cream"];

export default function BrowsePage() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [templates, setTemplates] = useState<TemplateListResponse[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateListResponse | null>(null);

  useEffect(() => {
    fetchCategories().then((cats) => setCategories(["전체", ...cats])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTemplates(category, search).then(setTemplates).catch(() => {});
  }, [category, search]);

  // 검색·카테고리 필터는 서버(GET /api/templates/browse)가 수행한다.
  // 여기서 다시 거르면 서버가 대소문자 무시·설명(description)까지 매칭해 돌려준 결과를
  // 클라이언트가 조용히 버려서 "검색 결과가 없습니다"가 뜬다. 이중 필터를 두지 않는다.

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
        {categories.map((cat) => (
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
        {templates.map((t, i) => (
          <TemplateCard
            key={t.id}
            id={t.id}
            title={t.name}
            subLabel={t.category}
            emoji="🎨"
            price={t.pricing === "free" ? "FREE" : "PRO"}
            bg={BG_COLORS[i % BG_COLORS.length]}
            onPreview={() => setPreviewTemplate(t)}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-[60px] font-body text-[14px] text-[#888]">
          검색 결과가 없습니다.
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
