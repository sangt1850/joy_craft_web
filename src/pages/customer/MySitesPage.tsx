// 내 사이트 페이지 — 전체/공개/초안 필터 + 사이트 카드 그리드
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelIcon from "../../components/ui/PixelIcon";
import NeoButton from "../../components/ui/NeoButton";
import SiteCard from "../../components/ui/SiteCard";
import TabBar from "../../components/ui/TabBar";
import SectionHeader from "../../components/ui/SectionHeader";

type FilterTab = "전체" | "공개" | "초안";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "전체", label: "전체" },
  { id: "공개", label: "공개" },
  { id: "초안", label: "초안" },
];

const SITES = [
  { id: "site-1", title: "승현이 생일 🎂", pages: 4, status: "공개", bg: "bg-blue" },
  { id: "site-2", title: "우리 1주년 💕",  pages: 6, status: "공개", bg: "bg-pink" },
  { id: "site-3", title: "엄마 환갑 🎉",   pages: 3, status: "초안", bg: "bg-mint" },
];

export default function MySitesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>("전체");

  const filtered = SITES.filter((s) => filter === "전체" || s.status === filter);

  return (
    <div className="px-7 py-8 max-w-[900px] mx-auto">

      {/* 헤더 */}
      <SectionHeader
        title="내 사이트"
        titleSize={28}
        as="h1"
        className="mb-7"
        action={
          <NeoButton bg="var(--color-pink)" size="sm" onClick={() => navigate("/editor/new")}>
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
            {...s}
            thumbHeight={140}
            onEdit={(id) => navigate(`/editor/${id}`)}
          />
        ))}

        {/* 새 사이트 만들기 카드 */}
        <button
          onClick={() => navigate("/editor/new")}
          className="neo-border cursor-pointer min-h-[260px] flex flex-col items-center justify-center gap-3 hover:bg-black/5 transition-colors neo-shadow-md"
          style={{ background: "transparent", outline: "none" }}
        >
          <div className="w-12 h-12 bg-pink neo-border flex items-center justify-center neo-shadow-sm">
            <PixelIcon name="plus" size={20} fill="#fff" />
          </div>
          <span className="font-sub text-[14px] text-ink">새 사이트 만들기</span>
        </button>
      </div>
    </div>
  );
}
