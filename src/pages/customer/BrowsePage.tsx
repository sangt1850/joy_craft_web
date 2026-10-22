// 페이지 둘러보기 — 템플릿 검색 + 카테고리 필터 + 카드 그리드
import { useState, useEffect } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import SearchInput from "../../components/ui/SearchInput";
import TemplateCard from "../../components/ui/TemplateCard";
import TemplatePreviewModal from "../../components/ui/TemplatePreviewModal";
import { fetchTemplates, fetchCategories } from "../../api/templates";
import type { TemplateListResponse } from "../../types/api";
import type { ThumbViewport } from "../../components/ui/LiveThumbnail";

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

// ─── 뷰 토글 버튼 ────────────────────────────────────────────────────────────────
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

export default function BrowsePage() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [thumbViewport, setThumbViewport] = useState<ThumbViewport>("mobile");
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
    <div className="px-4 py-7 md:px-8 md:py-9 max-w-[1120px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-[28px] m-0">페이지 둘러보기</h1>

        {/* PC / 모바일 뷰 토글 */}
        <div className="flex rounded-[11px] bg-selected p-1 overflow-hidden shrink-0">
          <ViewToggleBtn
            label="PC 보기"
            orientation="landscape"
            active={thumbViewport === "pc"}
            onClick={() => setThumbViewport("pc")}
          />
          <ViewToggleBtn
            label="모바일 보기"
            orientation="portrait"
            active={thumbViewport === "mobile"}
            onClick={() => setThumbViewport("mobile")}
            borderLeft
          />
        </div>
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

      {templates.length === 0 && (
        <div className="text-center py-[60px] font-body text-[14px] text-muted">
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
