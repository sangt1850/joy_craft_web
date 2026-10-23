// 내 사이트 페이지 — 전체/공개/초안 필터 + 사이트 카드 그리드
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PixelIcon from "../../components/ui/PixelIcon";
import NeoButton from "../../components/ui/NeoButton";
import SiteCard from "../../components/ui/SiteCard";
import TabBar from "../../components/ui/TabBar";
import SectionHeader from "../../components/ui/SectionHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ThumbViewportToggle from "../../components/ui/ThumbViewportToggle";
import type { ThumbViewport } from "../../components/ui/ThumbViewportToggle";
import { useSiteStore } from "../../store/siteStore";
import { useToastStore } from "../../store/toastStore";
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
  const addToast = useToastStore((s) => s.addToast);
  // 스토어 액션은 create() 시점에 한 번만 만들어지는 안정된 참조라 의존성에 넣어도 재실행되지 않는다
  const sites = useSiteStore((s) => s.sites);
  const isLoading = useSiteStore((s) => s.isLoading);
  const error = useSiteStore((s) => s.error);
  const loadSites = useSiteStore((s) => s.loadSites);
  const [filter, setFilter] = useState<FilterTab>("전체");
  const [thumbViewport, setThumbViewport] = useState<ThumbViewport>("mobile");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

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
    if (sharingId) return;
    setSharingId(String(id));
    try {
      const result = await publishSite(String(id));
      const link = window.location.origin + result.url;
      await navigator.clipboard.writeText(link).catch(() => {});
      addToast("링크가 클립보드에 복사되었습니다!", { variant: "success" });
    } catch {
      addToast("공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.", { variant: "error" });
    } finally {
      setSharingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSite(deleteTarget);
      loadSites();
      addToast("사이트가 삭제되었습니다.");
    } catch {
      addToast("삭제에 실패했습니다. 잠시 후 다시 시도해주세요.", { variant: "error" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 py-7 md:px-8 md:py-9 max-w-[1120px] mx-auto">

      {/* 헤더 */}
      <SectionHeader
        title="내 사이트"
        titleSize={28}
        as="h1"
        className="mb-7"
        action={
          <div className="flex items-center gap-3">
            <ThumbViewportToggle value={thumbViewport} onChange={setThumbViewport} />
            <NeoButton bg="var(--color-primary)" size="sm" onClick={handleNewSite}>
              <span className="flex items-center gap-1.5">
                <PixelIcon name="plus" size={12} fill="#fff" />
                새 사이트
              </span>
            </NeoButton>
          </div>
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
      {isLoading ? (
        <div className="text-center py-12 font-body text-[14px] text-muted">
          불러오는 중…
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="font-body text-[14px] m-0 mb-3 text-muted">
            사이트 목록을 불러오지 못했습니다.
          </p>
          <NeoButton bg="var(--color-secondary)" color="var(--color-ink)" size="sm" onClick={loadSites}>
            다시 시도
          </NeoButton>
        </div>
      ) : (
        <div className="neo-grid-md">
          {filtered.map((s) => (
            <SiteCard
              key={s.id}
              id={s.id}
              title={s.title}
              pages={s.slideCount}
              status={s.status === "PUBLISHED" ? "공개" : "초안"}
              bg={s.bgColor}
              enableLiveThumb
              liveThumbViewport={thumbViewport}
              onEdit={(id) => navigate(`/editor/${id}`)}
              onShare={handleShare}
              onDelete={(id) => setDeleteTarget(String(id))}
            />
          ))}

          {/* 새 사이트 만들기 카드 */}
          <button
            onClick={handleNewSite}
            className="rounded-[14px] border border-dashed border-[#cfc3da] cursor-pointer min-h-[260px] flex flex-col items-center justify-center gap-3 bg-transparent hover:bg-subtle transition-colors"
            style={{ background: "transparent", outline: "none" }}
          >
            <div className="w-12 h-12 rounded-[13px] bg-primary flex items-center justify-center">
              <PixelIcon name="plus" size={20} fill="#fff" />
            </div>
            <span className="font-sub text-[14px] text-ink">새 사이트 만들기</span>
          </button>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="사이트를 삭제할까요?"
          description="삭제하면 되돌릴 수 없습니다. 사이트의 모든 페이지가 함께 삭제됩니다."
          confirmLabel="삭제"
          confirming={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
