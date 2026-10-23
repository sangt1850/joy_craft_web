// 페이지 둘러보기 — 템플릿 검색 + 카테고리 필터 + 카드 그리드
import { useState, useEffect } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import SearchInput from "../../components/ui/SearchInput";
import TemplateCard from "../../components/ui/TemplateCard";
import TemplatePreviewModal from "../../components/ui/TemplatePreviewModal";
import ThumbViewportToggle from "../../components/ui/ThumbViewportToggle";
import type { ThumbViewport } from "../../components/ui/ThumbViewportToggle";
import { fetchTemplates, fetchCategories } from "../../api/templates";
import type { TemplateListResponse } from "../../types/api";

// 카테고리 pill — rounded-full 스타일로 TabBar와 별도 유지
const pillVariants = cva(
  "font-sub text-[12px] px-4 py-2 rounded-full cursor-pointer transition-colors border border-border",
  {
    variants: {
      active: {
        true:  "bg-selected text-heading font-semibold",
        false: "bg-surface text-muted hover:bg-subtle hover:text-heading",
      },
    },
  }
);

const BG_COLORS = ["bg-secondary", "bg-primary", "bg-accent", "bg-info", "bg-surface", "bg-bg"];

export default function BrowsePage() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [thumbViewport, setThumbViewport] = useState<ThumbViewport>("mobile");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [templates, setTemplates] = useState<TemplateListResponse[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCategories().then((cats) => setCategories(["전체", ...cats])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchTemplates(category, search)
      .then(setTemplates)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [category, search]);

  // 검색·카테고리 필터는 서버(GET /api/templates/browse)가 수행한다.
  // 여기서 다시 거르면 서버가 대소문자 무시·설명(description)까지 매칭해 돌려준 결과를
  // 클라이언트가 조용히 버려서 "검색 결과가 없습니다"가 뜬다. 이중 필터를 두지 않는다.

  return (
    <div className="px-4 py-7 md:px-8 md:py-9 max-w-[1120px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-[28px] m-0">페이지 둘러보기</h1>

        {/* PC / 모바일 뷰 토글 */}
        <ThumbViewportToggle value={thumbViewport} onChange={setThumbViewport} />
      </div>

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
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 템플릿 그리드 */}
      {loading ? (
        <div className="text-center py-12 font-body text-[14px] text-muted animate-pulse">
          불러오는 중…
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="font-body text-[14px] m-0 mb-3 text-muted">
            템플릿을 불러오지 못했습니다.
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(false);
              fetchTemplates(category, search)
                .then(setTemplates)
                .catch(() => setError(true))
                .finally(() => setLoading(false));
            }}
            className="jc-button h-9 rounded-lg bg-surface px-4 text-xs text-heading"
          >
            다시 시도
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-[60px] font-body text-[14px] text-muted">
          검색 결과가 없습니다.
        </div>
      ) : (
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
              thumbnailUrl={t.thumbnailUrl}
              onPreview={() => setPreviewTemplate(t)}
              enableLiveThumb
              liveThumbViewport={thumbViewport}
            />
          ))}
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
