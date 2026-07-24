// 사이트 에디터 — 상단 헤더 + 좌측 페이지 목록 + 가운데 프리뷰 + 우측 편집 패널
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import NeoButton from "../../components/ui/NeoButton";
import NeoCard from "../../components/ui/NeoCard";
import PixelIcon from "../../components/ui/PixelIcon";
import ToggleSwitch from "../../components/ui/ToggleSwitch";
import ColorPicker from "../../components/ui/ColorPicker";
import DashedButton from "../../components/ui/DashedButton";

type Device    = "mobile" | "desktop";
type MobileTab = "preview" | "edit" | "info";

const PAGE_COLORS = ["bg-pink", "bg-mustard", "bg-mint", "bg-blue"];

interface Page {
  id: string;
  name: string;
  colorIdx: number;
}

const DEFAULT_PAGES: Page[] = [
  { id: "p1", name: "질문",   colorIdx: 0 },
  { id: "p2", name: "편지",   colorIdx: 1 },
  { id: "p3", name: "꽃다발", colorIdx: 2 },
  { id: "p4", name: "갤러리", colorIdx: 3 },
];

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: "preview", label: "미리보기" },
  { id: "edit",    label: "편집" },
  { id: "info",    label: "정보" },
];

const YES_COLORS = [
  "var(--color-mustard)",
  "var(--color-pink)",
  "var(--color-mint)",
  "var(--color-blue)",
  "var(--color-peach)",
];

const LABEL_CLASS = "font-sub text-[12px] block mb-1.5";

export default function SiteEditorPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate   = useNavigate();

  const [pages, setPages]               = useState<Page[]>(DEFAULT_PAGES);
  const [selectedPage, setSelectedPage] = useState("p1");
  const [device, setDevice]             = useState<Device>("mobile");
  const [mobileTab, setMobileTab]       = useState<MobileTab>("preview");
  const [saved, setSaved]               = useState(true);

  const [questionText, setQuestionText] = useState("나 좋아해? 💕");
  const [yesText, setYesText]           = useState("응 ♥");
  const [noText, setNoText]             = useState("아니");
  const [yesColor, setYesColor]         = useState("var(--color-mustard)");
  const [dotBg, setDotBg]               = useState(true);

  const addPage = () => {
    const id = `p${Date.now()}`;
    setPages((p) => [...p, { id, name: `페이지 ${p.length + 1}`, colorIdx: p.length % 4 }]);
    setSelectedPage(id);
    setSaved(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F0E8] overflow-hidden">

      {/* ── 상단 헤더 ── */}
      <header className="flex items-center justify-between px-4 h-14 bg-cream border-b-[3px] border-ink shrink-0 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer px-2 py-1 shrink-0"
        >
          <PixelIcon name="back" size={16} fill="#111" />
        </button>

        <div className="flex-1 font-headline text-base text-center truncate">
          {siteId === "new" ? "새 사이트" : "내 사이트"}
        </div>

        <div className={cn("font-body text-[11px] shrink-0", saved ? "text-mint" : "text-peach")}>
          {saved ? "✓ 저장됨" : "저장 중..."}
        </div>

        {/* 디바이스 토글 (데스크탑만) */}
        <div className="hidden md:flex neo-border shrink-0">
          {(["mobile", "desktop"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={cn(
                "px-3 py-[5px] border-none cursor-pointer text-base",
                device === d ? "bg-ink" : "bg-transparent"
              )}
            >
              {d === "mobile" ? "📱" : "💻"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <NeoButton bg="var(--color-mint)" color="#111" size="sm" shadow={3}>미리보기</NeoButton>
          <NeoButton bg="var(--color-pink)" size="sm" shadow={3}>공유</NeoButton>
        </div>
      </header>

      {/* ── 모바일 세그먼트 탭 ── */}
      <div className="flex md:hidden border-b-[3px] border-ink bg-cream shrink-0">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 py-[10px] border-none border-r-2 border-ink font-sub text-[13px] cursor-pointer last:border-r-0",
              mobileTab === tab.id ? "bg-ink text-cream" : "bg-transparent text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* 좌측: 페이지 목록 */}
        <aside className="hidden md:flex w-[180px] bg-cream border-r-[3px] border-ink flex-col overflow-hidden shrink-0">
          <div className="px-3 pt-3 pb-2 font-sub text-[12px] text-[#888] border-b-[2px] border-black/10">
            페이지 목록
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={cn(
                  "flex items-center gap-2.5 px-[10px] py-[9px] mb-1 rounded-md border-2 cursor-pointer",
                  selectedPage === page.id
                    ? "bg-ink border-ink"
                    : "bg-transparent border-transparent hover:bg-black/5"
                )}
              >
                <div
                  className={cn(
                    "w-[22px] h-[22px] neo-border flex items-center justify-center shrink-0 font-pixel text-[8px] text-ink",
                    PAGE_COLORS[page.colorIdx]
                  )}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    "font-sub text-[13px] truncate",
                    selectedPage === page.id ? "text-cream" : "text-ink"
                  )}
                >
                  {page.name}
                </span>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            <DashedButton onClick={addPage}>페이지 추가</DashedButton>
          </div>
        </aside>

        {/* 가운데: 미리보기 */}
        <div className="flex-1 flex items-center justify-center p-6 bg-[#E8E0D4] overflow-auto">
          <div
            className="relative transition-[width] duration-200"
            style={{ width: device === "mobile" ? 320 : 720 }}
          >
            {device === "mobile" && (
              <div className="bg-ink h-7 rounded-t-xl border-[3px] border-b-0 border-ink flex items-center justify-center">
                <div className="w-[60px] h-1.5 bg-white/30 rounded-full" />
              </div>
            )}

            <NeoCard
              pad={32}
              shadow={8}
              style={{
                background:       "linear-gradient(160deg, #FFB784 0%, #FF57A6 100%)",
                minHeight:        device === "mobile" ? 480 : 400,
                display:          "flex",
                flexDirection:    "column",
                alignItems:       "center",
                justifyContent:   "center",
                gap:              20,
                borderRadius:     device === "mobile" ? "0 0 12px 12px" : 0,
                position:         "relative",
                overflow:         "hidden",
              }}
            >
              {dotBg && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize:  "16px 16px",
                  }}
                />
              )}
              <PixelIcon name="heart" size={36} fill="#fff" />
              <p className="font-headline text-[22px] text-white text-center m-0">
                {questionText}
              </p>
              <div className="flex gap-[14px] flex-wrap justify-center">
                <NeoButton bg={yesColor} color="#111" size="md">{yesText}</NeoButton>
                <NeoButton bg="var(--color-cream)" color="#111" size="md">{noText}</NeoButton>
              </div>
            </NeoCard>
          </div>
        </div>

        {/* 우측: 편집 패널 */}
        <aside className="hidden md:flex w-[260px] bg-cream border-l-[3px] border-ink flex-col overflow-hidden shrink-0">
          <div className="px-4 pt-3 pb-2 font-sub text-[12px] text-[#888] border-b-[2px] border-black/10">
            편집
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-[18px]">
            <div>
              <label className={LABEL_CLASS}>질문</label>
              <input
                value={questionText}
                onChange={(e) => { setQuestionText(e.target.value); setSaved(false); }}
                className="neo-input"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>"예" 버튼</label>
              <input
                value={yesText}
                onChange={(e) => { setYesText(e.target.value); setSaved(false); }}
                className="neo-input"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>"아니" 버튼</label>
              <input
                value={noText}
                onChange={(e) => { setNoText(e.target.value); setSaved(false); }}
                className="neo-input"
              />
            </div>

            <ColorPicker
              label='"예" 버튼 색상'
              colors={YES_COLORS}
              value={yesColor}
              onChange={(c) => { setYesColor(c); setSaved(false); }}
            />

            <ToggleSwitch
              label="도트 배경"
              checked={dotBg}
              onChange={(v) => { setDotBg(v); setSaved(false); }}
            />
          </div>

          {/* 공유 CTA */}
          <div className="px-4 py-3 border-t-[3px] border-ink bg-mustard">
            <NeoButton bg="#111" color="#FFF7E6" block size="sm" shadow={4}>
              🔗 링크 만들어 공유
            </NeoButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
