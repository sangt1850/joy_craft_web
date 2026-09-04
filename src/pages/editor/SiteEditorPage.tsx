// 사이트 에디터 — 상단 헤더 + 좌측 페이지 목록 + 가운데 미리보기 + 우측 편집 패널
//
// 편집 패널은 하드코딩 필드가 아니라 **스키마 순회**로 그린다 (SlideFieldsPanel).
// 미리보기는 실제 슬라이드 컴포넌트를 렌더한다 (SlideCanvas).
//
// 슬라이드(src/slides/**)는 디자인 시스템을 따르지 않는 독립 캔버스이므로
// 여기서는 크기를 잡는 컨테이너(position:relative)만 제공하고 스타일을 주입하지 않는다.
import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import NeoButton from "../../components/ui/NeoButton";
import NeoCard from "../../components/ui/NeoCard";
import PixelIcon from "../../components/ui/PixelIcon";
import DashedButton from "../../components/ui/DashedButton";
import SlideCanvas from "../../components/player/SlideCanvas";
import SlideList from "../../components/editor/SlideList";
import SlideFieldsPanel from "../../components/editor/SlideFieldsPanel";
import TemplatePickerModal from "../../components/editor/TemplatePickerModal";
import { useEditorStore, UnsavedChangesError } from "../../store/editorStore";
import { createSite } from "../../api/sites";
import { publishSite } from "../../api/editor";
import { resolveAssetRefsDeep } from "../../api/assets";
import {
  resolveEditorSchema,
  mergeSlideValues,
  fillMissingWithDefaults,
} from "../../slides/schemaAdapter";

type Device = "mobile" | "desktop";
type MobileTab = "pages" | "preview" | "edit";

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: "pages", label: "페이지" },
  { id: "preview", label: "미리보기" },
  { id: "edit", label: "편집" },
];

/** 미리보기 스테이지 크기 — 슬라이드는 모바일 세로 화면 기준으로 만들어져 있다 */
const STAGE = {
  mobile: { width: 320, height: 568 },
  desktop: { width: 720, height: 460 },
} as const;

/** 모바일 프리뷰 상단 노치 바 높이(px) — 스케일 계산 시 스테이지 높이에 더해준다 */
const NOTCH_HEIGHT = 28;

/**
 * 미리보기 영역이 남는 공간을 꽉 채우면서도 절대 잘리지 않도록,
 * 컨테이너 실측 크기에 맞춰 고정 디자인 해상도를 transform: scale로 맞춘다.
 * (좌우 패널 접힘, 창 크기 변경, 디바이스 전환 모두 ResizeObserver로 자동 반응)
 */
function useFitScale(designWidth: number, designHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.min(width / designWidth, height / designHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth, designHeight]);

  return { containerRef, scale };
}

export default function SiteEditorPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();

  const {
    site,
    selectedSlideId,
    isSaving,
    isDirty,
    saveError,
    loadSite,
    selectSlide,
    updateSlideOverrides,
    resetSlideOverrides,
    updateTitle,
    flush,
    addSlide,
    removeSlide,
    reorderSlides,
    reset,
  } = useEditorStore();

  const [device, setDevice] = useState<Device>("mobile");
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // 미리보기 강제 리마운트용 — 애니메이션이 한 번만 도는 슬라이드를 다시 보기 위해
  const [previewNonce, setPreviewNonce] = useState(0);

  const stageSize = STAGE[device];
  const designWidth = stageSize.width;
  const designHeight = stageSize.height + (device === "mobile" ? NOTCH_HEIGHT : 0);
  const { containerRef: previewAreaRef, scale } = useFitScale(designWidth, designHeight);

  useEffect(() => {
    setLoadError(false);
    if (siteId && siteId !== "new") {
      loadSite(siteId).catch(() => setLoadError(true));
    } else if (siteId === "new") {
      createSite("새 사이트")
        .then((s) => navigate(`/editor/${s.id}`, { replace: true }))
        .catch(() => setLoadError(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // 에디터를 떠날 때 예약된 저장 타이머를 정리한다
  useEffect(() => reset, [reset]);

  const slides = site?.slides ?? [];
  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  // 에디터는 서버가 병합해주지 않는다 — defaultValues + overrides를 여기서 합친다
  const values = useMemo(
    () =>
      selectedSlide
        ? mergeSlideValues(selectedSlide.defaultValues, selectedSlide.overrides)
        : {},
    [selectedSlide]
  );

  // 로컬 스키마 우선 + 서버 스키마 보조
  const schema = useMemo(
    () =>
      selectedSlide
        ? resolveEditorSchema(selectedSlide.componentRef, selectedSlide.schema)
        : null,
    [selectedSlide]
  );

  // 값이 비면 렌더 중 throw하는 슬라이드가 있어 스키마 기본값으로 구멍을 메운다
  const editorValues = useMemo(
    () => (schema ? fillMissingWithDefaults(schema, values) : values),
    [schema, values]
  );

  const previewValues = useMemo(
    () => resolveAssetRefsDeep(editorValues),
    [editorValues]
  );

  const setField = useCallback(
    (key: string, value: unknown) => {
      if (!selectedSlideId) return;
      updateSlideOverrides(selectedSlideId, { [key]: value });
    },
    [selectedSlideId, updateSlideOverrides]
  );

  const handleSave = async () => {
    setIsSavingManual(true);
    try {
      await flush();
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDiscard = async () => {
    if (!siteId || siteId === "new") return;
    if (!window.confirm("편집 중인 내용을 모두 취소하고 마지막 저장 상태로 되돌릴까요?")) return;
    await loadSite(siteId);
  };

  // 발행 스냅샷은 불변이라 되돌릴 수 없다 →
  // 렌더 클로저(isDirty)가 아니라 getState()로 최신 상태를 읽고,
  // flush()가 성공을 확인해 준 뒤에만 발행한다.
  const handlePublish = async () => {
    const { site: current, flush } = useEditorStore.getState();
    if (!current) return;
    setIsPublishing(true);
    try {
      const saved = await flush();
      if (!saved) {
        alert("저장하지 못한 변경이 있어 발행하지 않았습니다.\n잠시 후 다시 시도해 주세요.");
        return;
      }
      const result = await publishSite(current.id);
      const link = window.location.origin + result.url;
      await navigator.clipboard.writeText(link).catch(() => {});
      alert(`링크가 복사되었습니다!\n${link}`);
    } catch {
      alert("게시에 실패했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemoveSlide = (id: string) => {
    const target = slides.find((s) => s.id === id);
    if (!window.confirm(`"${target?.templateName ?? "이 페이지"}"를 삭제할까요?`)) return;
    removeSlide(id).catch((e: unknown) =>
      alert(
        e instanceof UnsavedChangesError
          ? "저장하지 못한 변경이 있어 삭제하지 않았습니다.\n잠시 후 다시 시도해 주세요."
          : "페이지 삭제에 실패했습니다."
      )
    );
  };

  const saveLabel = isSaving
    ? "저장 중..."
    : saveError
      ? "저장 실패"
      : isDirty
        ? "미저장"
        : "✓ 저장됨";

  return (
    <div className="flex flex-col h-dvh bg-[#F5F0E8] overflow-hidden">
      {/* ── 상단 헤더 ── */}
      <header className="flex items-center justify-between px-4 h-14 bg-bg border-b-[3px] border-ink shrink-0 gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer px-2 py-1 shrink-0"
        >
          <PixelIcon name="back" size={16} fill="#111" />
        </button>

        {site ? (
          <input
            value={site.title}
            onChange={(e) => updateTitle(e.target.value)}
            aria-label="사이트 제목"
            className="neo-input flex-1 min-w-0 font-headline text-base text-center h-9"
          />
        ) : (
          <div className="flex-1 font-headline text-base text-center truncate">
            {loadError ? "불러오지 못했습니다" : siteId === "new" ? "새 사이트" : "로딩 중..."}
          </div>
        )}

        <div
          className={cn(
            "font-body text-[11px] shrink-0 hidden sm:block",
            saveError ? "text-primary" : isDirty || isSaving ? "text-surface" : "text-accent"
          )}
        >
          {saveLabel}
        </div>

        {/* 디바이스 토글 (데스크탑만) */}
        <div className="hidden md:flex neo-border shrink-0">
          {(["mobile", "desktop"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              aria-label={d === "mobile" ? "모바일 미리보기" : "데스크탑 미리보기"}
              aria-pressed={device === d}
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
          {isDirty && (
            <NeoButton
              bg="var(--color-bg)"
              color="#111"
              size="sm"
              shadow={3}
              onClick={handleDiscard}
              disabled={isSaving || isSavingManual}
            >
              취소
            </NeoButton>
          )}
          <NeoButton
            bg={isDirty ? "var(--color-secondary)" : "var(--color-bg)"}
            color="#111"
            size="sm"
            shadow={3}
            onClick={handleSave}
            disabled={!isDirty || isSaving || isSavingManual || !site}
          >
            {isSaving || isSavingManual ? "저장 중..." : "저장"}
          </NeoButton>
          <NeoButton
            bg="var(--color-accent)"
            color="#111"
            size="sm"
            shadow={3}
            onClick={() => setPreviewNonce((n) => n + 1)}
          >
            다시 보기
          </NeoButton>
          <NeoButton
            bg="var(--color-primary)"
            size="sm"
            shadow={3}
            onClick={handlePublish}
            disabled={isPublishing || !site}
          >
            {isPublishing ? "..." : "공유"}
          </NeoButton>
        </div>
      </header>

      {/* ── 모바일 세그먼트 탭 ── */}
      <div className="flex md:hidden border-b-[3px] border-ink bg-bg shrink-0">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 py-[10px] border-none border-r-2 border-ink font-sub text-[13px] cursor-pointer last:border-r-0",
              mobileTab === tab.id ? "bg-ink text-bg" : "bg-transparent text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 페이지 목록 */}
        <aside
          className={cn(
            "w-full md:w-[200px] bg-bg md:border-r-[3px] border-ink flex-col overflow-hidden shrink-0",
            mobileTab === "pages" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-3 pt-3 pb-2 font-sub text-[12px] text-[#888] border-b-[2px] border-black/10">
            페이지 목록 ({slides.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <SlideList
              slides={slides}
              selectedId={selectedSlideId}
              onSelect={(id) => {
                selectSlide(id);
                setMobileTab("preview");
              }}
              onReorder={(ids) => void reorderSlides(ids)}
              onRemove={handleRemoveSlide}
            />
          </div>
          <div className="px-3 pb-3">
            <DashedButton onClick={() => setPickerOpen(true)}>페이지 추가</DashedButton>
          </div>
        </aside>

        {/* 가운데: 미리보기 */}
        <div
          className={cn(
            "flex-1 min-w-0 p-4 md:p-6 bg-[#E8E0D4] overflow-hidden",
            mobileTab === "preview" ? "flex" : "hidden md:flex"
          )}
        >
          {selectedSlide && schema ? (
            // 실측 컨테이너 — 패딩이 없는 순수 가용 공간을 ResizeObserver로 측정해
            // 고정 디자인 해상도(designWidth x designHeight)를 빈틈/잘림 없이 채운다
            <div ref={previewAreaRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
              <div
                className="shrink-0"
                style={{ width: designWidth * scale, height: designHeight * scale }}
              >
                <div
                  style={{
                    width: designWidth,
                    height: designHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/*
                    기기 목업 전체(노치 바 + 스테이지)를 하나의 그림자로 감싼다 —
                    브루탈리즘 오프셋 섀도우 대신, 실제 기기가 바닥에 놓인 듯한
                    부드러운 다중 레이어 블러 섀도우(자연광 + 앰비언트 근접광).
                  */}
                  <div
                    style={{
                      borderRadius: device === "mobile" ? 14 : 4,
                      boxShadow:
                        "0 1px 2px rgba(17,17,17,0.08), 0 8px 16px -4px rgba(17,17,17,0.18), 0 28px 48px -12px rgba(17,17,17,0.38)",
                    }}
                  >
                    {device === "mobile" && (
                      <div className="bg-ink h-7 rounded-t-xl border-[3px] border-b-0 border-ink flex items-center justify-center">
                        <div className="w-[60px] h-1.5 bg-white/30 rounded-full" />
                      </div>
                    )}
                    {/*
                      슬라이드 캔버스 — position:relative + 크기만 제공.
                      슬라이드는 absolute; inset:0 풀블리드이므로 스타일 주입 금지.
                      key(slideKey)가 바뀌면 리마운트되어 이전 슬라이드의 타이머가 튀지 않는다.
                    */}
                    <div
                      className={cn(
                        "neo-border-4 bg-bg relative overflow-hidden",
                        device === "mobile" ? "rounded-b-xl" : ""
                      )}
                      style={{ width: stageSize.width, height: stageSize.height }}
                    >
                      <SlideCanvas
                        slideKey={`${selectedSlide.id}:${previewNonce}:${device}`}
                        componentRef={selectedSlide.componentRef}
                        values={previewValues}
                        isPreview
                        onSkip={() => setPreviewNonce((n) => n + 1)}
                        skipLabel="다시 보기"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
              <NeoCard bg="var(--color-bg)" pad={24} shadow={6} className="max-w-[360px]">
                <h2 className="font-headline text-[18px] mb-2">
                  {loadError ? "사이트를 불러오지 못했어요" : "페이지를 추가해 보세요"}
                </h2>
                <p className="font-body text-[12px] leading-relaxed mb-4">
                  {loadError
                    ? "잠시 후 다시 시도해 주세요."
                    : "왼쪽 목록에서 '페이지 추가'를 눌러 원하는 슬라이드를 고르면 여기에서 바로 편집할 수 있어요."}
                </p>
                {!loadError && (
                  <NeoButton bg="var(--color-primary)" size="sm" onClick={() => setPickerOpen(true)}>
                    페이지 추가
                  </NeoButton>
                )}
              </NeoCard>
            </div>
          )}
        </div>

        {/* 우측: 편집 패널 — 스키마 순회로 자동 생성 */}
        <aside
          className={cn(
            "w-full md:w-[320px] bg-bg md:border-l-[3px] border-ink flex-col overflow-hidden shrink-0",
            mobileTab === "edit" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-4 pt-3 pb-2 border-b-[2px] border-black/10 flex items-center gap-2">
            <span className="font-sub text-[12px] text-[#888] truncate flex-1 min-w-0">
              {selectedSlide ? `편집 · ${selectedSlide.templateName}` : "편집"}
            </span>
            {selectedSlide && (
              <button
                onClick={() => {
                  if (!window.confirm("이 페이지의 모든 편집을 기본값으로 되돌릴까요?")) return;
                  resetSlideOverrides(selectedSlide.id);
                }}
                className="font-body text-[11px] text-[#888] hover:text-ink border border-black/20 rounded px-2 py-0.5 shrink-0 cursor-pointer bg-transparent hover:bg-black/5"
              >
                기본값으로
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedSlide && schema ? (
              // key: 슬라이드를 바꾸면 위젯 로컬 버퍼(숫자 입력 중간 상태, JSON 편집 토글)를 초기화한다
              <SlideFieldsPanel
                key={selectedSlide.id}
                schema={schema}
                // 미리보기와 같은 값을 본다 — 패널만 "항목 없음"으로 보이던 괴리를 없앤다.
                // 채워진 기본값은 화면 표시용일 뿐, 사용자가 건드리기 전까지 override는 생기지 않는다.
                values={editorValues}
                defaultValues={selectedSlide.defaultValues}
                onChange={setField}
              />
            ) : (
              <p className="font-body text-[12px] text-[#888] leading-relaxed">
                편집할 페이지를 선택해 주세요.
              </p>
            )}
          </div>

          {/* 공유 CTA */}
          <div className="px-4 py-3 border-t-[3px] border-ink bg-secondary shrink-0">
            <NeoButton
              bg="#111"
              color="#FFF7E6"
              block
              size="sm"
              shadow={4}
              onClick={handlePublish}
              disabled={isPublishing || !site}
            >
              🔗 링크 만들어 공유
            </NeoButton>
          </div>
        </aside>
      </div>

      <TemplatePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        // 실패 시 다시 던져야 모달이 닫히지 않는다 (TemplatePickerModal 계약)
        onSelect={async (templateId) => {
          try {
            await addSlide(templateId);
          } catch (e) {
            alert(
              e instanceof UnsavedChangesError
                ? "저장하지 못한 변경이 있어 페이지를 추가하지 않았습니다.\n잠시 후 다시 시도해 주세요."
                : "페이지 추가에 실패했습니다."
            );
            throw e;
          }
          setMobileTab("preview");
        }}
      />
    </div>
  );
}
