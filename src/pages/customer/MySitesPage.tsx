// 내 사이트 페이지 — 전체/공개/초안 필터 + 사이트 카드 그리드
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PixelIcon from "../../components/ui/PixelIcon";
import NeoButton from "../../components/ui/NeoButton";
import SiteCard from "../../components/ui/SiteCard";
import TabBar from "../../components/ui/TabBar";
import SectionHeader from "../../components/ui/SectionHeader";
import { useSiteStore } from "../../store/siteStore";
import { createSite, deleteSite } from "../../api/sites";
import { publishSite } from "../../api/editor";

type FilterTab = "전체" | "공개" | "초안";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "전체", label: "전체" },
  { id: "공개", label: "공개" },
  { id: "초안", label: "초안" },
];

export default function MySitesPage() {
  const navigate = useNavigate();
  // 스토어 액션은 create() 시점에 한 번만 만들어지는 안정된 참조라 의존성에 넣어도 재실행되지 않는다
  const sites = useSiteStore((s) => s.sites);
  const loadSites = useSiteStore((s) => s.loadSites);
  const [filter, setFilter] = useState<FilterTab>("전체");

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const filtered = sites.filter((s) => {
    if (filter === "전체") return true;
    if (filter === "공개") return s.status === "PUBLISHED";
    if (filter === "초안") return s.status === "DRAFT";
    return true;
  });

  const handleNewSite = async () => {
    try {
      const site = await createSite("새 사이트");
      navigate(`/editor/${site.id}`);
    } catch {
      navigate("/editor/new");
    }
  };

  const handleShare = async (id: string | number) => {
    try {
      const result = await publishSite(String(id));
      const link = window.location.origin + result.url;
      await navigator.clipboard.writeText(link).catch(() => {});
      alert(`링크가 복사되었습니다!\n${link}`);
    } catch {
      alert("공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("사이트를 삭제할까요? 되돌릴 수 없습니다.")) return;
    try {
      await deleteSite(String(id));
      loadSites();
    } catch {
      alert("삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="px-7 py-8 max-w-[900px] mx-auto">

      {/* 헤더 */}
      <SectionHeader
        title="내 사이트"
        titleSize={28}
        as="h1"
        className="mb-7"
        action={
          <NeoButton bg="var(--color-primary)" size="sm" onClick={handleNewSite}>
            <span className="flex items-center gap-1.5">
              <PixelIcon name="plus" size={12} fill="#fff" />
              새 사이트
            </span>
          </NeoButton>
        }
      />

      {/* 필터 탭 */}
      <TabBar
        tabs={FILTER_TABS}
        active={filter}
        onChange={setFilter}
        className="mb-7"
      />

      {/* 사이트 그리드 */}
      <div className="neo-grid-md">
        {filtered.map((s) => (
          <SiteCard
            key={s.id}
            id={s.id}
            title={s.title}
            pages={s.slideCount}
            status={s.status === "PUBLISHED" ? "공개" : "초안"}
            bg={s.bgColor}
            thumbHeight={140}
            onEdit={(id) => navigate(`/editor/${id}`)}
            onShare={handleShare}
            onDelete={handleDelete}
          />
        ))}

        {/* 새 사이트 만들기 카드 */}
        <button
          onClick={handleNewSite}
          className="neo-border cursor-pointer min-h-[260px] flex flex-col items-center justify-center gap-3 hover:bg-black/5 transition-colors neo-shadow-md"
          style={{ background: "transparent", outline: "none" }}
        >
          <div className="w-12 h-12 bg-primary neo-border flex items-center justify-center neo-shadow-sm">
            <PixelIcon name="plus" size={20} fill="#fff" />
          </div>
          <span className="font-sub text-[14px] text-ink">새 사이트 만들기</span>
        </button>
      </div>
    </div>
  );
}
