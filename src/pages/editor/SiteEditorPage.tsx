// 사이트 에디터 — 상단 헤더 + 좌측 페이지 목록 + 가운데 프리뷰 + 우측 편집 패널
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import NeoButton from "../../components/ui/NeoButton";
import RunAwayButton from "../../components/ui/RunAwayButton";
import NeoCard from "../../components/ui/NeoCard";
import PixelIcon from "../../components/ui/PixelIcon";
import ToggleSwitch from "../../components/ui/ToggleSwitch";
import ColorPicker from "../../components/ui/ColorPicker";
import DashedButton from "../../components/ui/DashedButton";
import { useEditorStore } from "../../store/editorStore";
import { createSite } from "../../api/sites";
import { publishSite } from "../../api/editor";

type Device    = "mobile" | "desktop";
type MobileTab = "preview" | "edit" | "info";

const PAGE_COLORS = ["bg-pink", "bg-mustard", "bg-mint", "bg-blue"];

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

  const { site, selectedSlideId, isSaving, isDirty, loadSite, selectSlide, updateSlideOverrides, updateTitle } = useEditorStore();

  const [device, setDevice]       = useState<Device>("mobile");
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (siteId && siteId !== "new") {
      loadSite(siteId);
    } else if (siteId === "new") {
      // new 사이트 생성 후 리다이렉트
      createSite("새 사이트").then((s) => {
        navigate(`/editor/${s.id}`, { replace: true });
      }).catch(() => {});
    }
  }, [siteId]);

  const selectedSlide = site?.slides.find((s) => s.id === selectedSlideId);
  const overrides = selectedSlide ? { ...selectedSlide.defaultValues, ...selectedSlide.overrides } : {};

  const questionText = String(overrides["questionText"] ?? "오늘 하루 즐거웠나요?");
  const yesText      = String(overrides["yesText"]      ?? "네!");
  const noText       = String(overrides["noText"]       ?? "아니요");
  const yesColor     = String(overrides["yesColor"]     ?? "var(--color-mustard)");
  const dotBg        = Boolean(overrides["dotBg"]       ?? true);

  const setOverride = (key: string, value: unknown) => {
    if (!selectedSlideId) return;
    updateSlideOverrides(selectedSlideId, { [key]: value });
  };

  const handlePublish = async () => {
    if (!site) return;
    setIsPublishing(true);
    try {
      const result = await publishSite(site.id);
      const link = window.location.origin + result.url;
      await navigator.clipboard.writeText(link).catch(() => {});
      alert(`링크가 복사되었습니다!\n${link}`);
    } catch {
      alert("게시에 실패했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };

  const pages = site?.slides ?? [];

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
          {site?.title ?? (siteId === "new" ? "새 사이트" : "로딩 중...")}
        </div>

        <div className={cn("font-body text-[11px] shrink-0", isDirty || isSaving ? "text-peach" : "text-mint")}>
          {isSaving ? "저장 중..." : isDirty ? "미저장" : "✓ 저장됨"}
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
          <NeoButton
            bg="var(--color-pink)"
            size="sm"
            shadow={3}
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? "..." : "공유"}
          </NeoButton>
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
                onClick={() => selectSlide(page.id)}
                className={cn(
                  "flex items-center gap-2.5 px-[10px] py-[9px] mb-1 rounded-md border-2 cursor-pointer",
                  selectedSlideId === page.id
                    ? "bg-ink border-ink"
                    : "bg-transparent border-transparent hover:bg-black/5"
                )}
              >
                <div
                  className={cn(
                    "w-[22px] h-[22px] neo-border flex items-center justify-center shrink-0 font-pixel text-[8px] text-ink",
                    PAGE_COLORS[idx % PAGE_COLORS.length]
                  )}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    "font-sub text-[13px] truncate",
                    selectedSlideId === page.id ? "text-cream" : "text-ink"
                  )}
                >
                  {page.templateName}
                </span>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            <DashedButton onClick={() => alert("템플릿 선택 기능 준비 중")}>페이지 추가</DashedButton>
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
                <RunAwayButton bg="var(--color-cream)" color="#111" size="md">{noText}</RunAwayButton>
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
                onChange={(e) => setOverride("questionText", e.target.value)}
                className="neo-input"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>"예" 버튼</label>
              <input
                value={yesText}
                onChange={(e) => setOverride("yesText", e.target.value)}
                className="neo-input"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>"아니요" 버튼</label>
              <input
                value={noText}
                onChange={(e) => setOverride("noText", e.target.value)}
                className="neo-input"
              />
            </div>

            <ColorPicker
              label='"예" 버튼 색상'
              colors={YES_COLORS}
              value={yesColor}
              onChange={(c) => setOverride("yesColor", c)}
            />

            <ToggleSwitch
              label="도트 배경"
              checked={dotBg}
              onChange={(v) => setOverride("dotBg", v)}
            />
          </div>

          {/* 공유 CTA */}
          <div className="px-4 py-3 border-t-[3px] border-ink bg-mustard">
            <NeoButton
              bg="#111"
              color="#FFF7E6"
              block
              size="sm"
              shadow={4}
              onClick={handlePublish}
              disabled={isPublishing}
            >
              🔗 링크 만들어 공유
            </NeoButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
