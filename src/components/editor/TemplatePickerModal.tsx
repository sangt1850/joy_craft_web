// "페이지 추가" 템플릿 선택 모달.
// GET /api/templates/browse(= api/templates.fetchTemplates)를 그대로 쓰고
// 카드는 기존 TemplateCard를 재사용한다.
import { useEffect, useState } from "react";
import { fetchTemplates, fetchCategories } from "../../api/templates";
import type { TemplateListResponse } from "../../types/api";
import NeoCard from "../ui/NeoCard";
import NeoButton from "../ui/NeoButton";
import SearchInput from "../ui/SearchInput";
import TemplateCard from "../ui/TemplateCard";
import TabBar from "../ui/TabBar";

const BG_COLORS = ["bg-secondary", "bg-primary", "bg-accent", "bg-info", "bg-surface", "bg-bg"];

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  /** 템플릿 id를 고르면 호출. 실패 시 예외를 던지면 모달이 닫히지 않는다 */
  onSelect: (templateId: string) => Promise<void> | void;
}

export default function TemplatePickerModal({ open, onClose, onSelect }: TemplatePickerModalProps) {
  const [templates, setTemplates] = useState<TemplateListResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // 이전에 추가에 성공하고 닫힌 뒤 다시 열면 "추가하는 중..." 라벨이 남는다
    setAdding(null);
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    fetchTemplates(category)
      .then((list) => {
        if (alive) setTemplates(list);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, category]);

  if (!open) return null;

  // 서버 search 파라미터가 무시되는 문제가 있어 목록 필터는 프론트에서 한 번 더 건다
  const visible = search
    ? templates.filter((t) => t.name.includes(search) || t.category.includes(search))
    : templates;

  const handleUse = async (id: string | number) => {
    const templateId = String(id);
    setAdding(templateId);
    try {
      await onSelect(templateId);
      onClose();
    } catch {
      setAdding(null);
    }
  };

  const tabs = [{ id: "전체", label: "전체" }, ...categories.map((c) => ({ id: c, label: c }))];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/55 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[760px] max-h-[86dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="페이지 추가"
      >
        <NeoCard bg="var(--color-bg)" pad={0} shadow={8} className="flex flex-col max-h-[86dvh]">
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b-[3px] border-ink shrink-0">
            <h2 className="font-headline text-[18px] m-0">페이지 추가</h2>
            <NeoButton bg="var(--color-bg)" size="sm" shadow={3} onClick={onClose}>
              닫기
            </NeoButton>
          </div>

          {/* 검색 + 카테고리 */}
          <div className="px-5 pt-4 shrink-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="템플릿 검색..."
              maxWidth={420}
              className="mb-3"
            />
            {tabs.length > 1 && (
              <TabBar tabs={tabs} active={category} onChange={setCategory} className="mb-3" />
            )}
          </div>

          {/* 목록 */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {loading && (
              <p className="font-body text-[13px] text-black/50 py-10 text-center">불러오는 중...</p>
            )}

            {!loading && failed && (
              <p className="font-body text-[13px] text-black/50 py-10 text-center">
                템플릿 목록을 불러오지 못했습니다.
              </p>
            )}

            {!loading && !failed && visible.length === 0 && (
              <p className="font-body text-[13px] text-black/50 py-10 text-center">
                조건에 맞는 템플릿이 없습니다.
              </p>
            )}

            {!loading && !failed && visible.length > 0 && (
              <div className="neo-grid-sm">
                {visible.map((t, i) => (
                  <TemplateCard
                    key={t.id}
                    id={t.id}
                    title={adding === t.id ? "추가하는 중..." : t.name}
                    subLabel={t.category}
                    emoji="🎨"
                    price={t.pricing === "free" ? "FREE" : "PRO"}
                    bg={BG_COLORS[i % BG_COLORS.length]}
                    thumbHeight={96}
                    onUse={handleUse}
                  />
                ))}
              </div>
            )}
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
