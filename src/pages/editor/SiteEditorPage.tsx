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
import DashedButton from "../../components/ui/DashedButton";
import SlideCanvas from "../../components/player/SlideCanvas";
import SlideList from "../../components/editor/SlideList";
import SlideFieldsPanel from "../../components/editor/SlideFieldsPanel";
import TemplatePickerModal from "../../components/editor/TemplatePickerModal";
import { useEditorStore, UnsavedChangesError } from "../../store/editorStore";
import { useToastStore } from "../../store/toastStore";
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

/** 모바일 케이스 패딩(px) — 참고 디자인 기준 */
const MOBILE_CASE_PAD = 9;
/** 모바일 프리뷰 상단 노치 바 높이(px) */
const NOTCH_HEIGHT = 28;
/** 데스크탑 브라우저 크롬 바 높이(px) */
const DESKTOP_BAR_HEIGHT = 34;

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
  const addToast = useToastStore((s) => s.addToast);

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
  // 모바일: 케이스 패딩(양쪽) + 노치 바 포함, 데스크탑: 브라우저 크롬 바 포함
  const designWidth = device === "mobile"
    ? stageSize.width + MOBILE_CASE_PAD * 2
    : stageSize.width;
  const designHeight = device === "mobile"
    ? NOTCH_HEIGHT + stageSize.height + MOBILE_CASE_PAD * 2
    : DESKTOP_BAR_HEIGHT + stageSize.height;
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

  // 미저장 상태에서 브라우저 닫기/새로고침 방지
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

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
        addToast("저장하지 못한 변경이 있어 발행하지 않았습니다. 잠시 후 다시 시도해 주세요.", { variant: "error" });
        return;
      }
      const result = await publishSite(current.id);
      const link = window.location.origin + result.url;
      await navigator.clipboard.writeText(link).catch(() => {});
      addToast("링크가 클립보드에 복사되었습니다!", { variant: "success" });
    } catch {
      addToast("게시에 실패했습니다. 잠시 후 다시 시도해 주세요.", { variant: "error" });
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
    <div className="flex flex-col h-dvh bg-bg overflow-hidden text-ink">
      {/* ── 상단 헤더 ── */}
      <header className="flex items-center px-3 md:px-[14px] h-[60px] md:h-[56px] bg-surface border-b border-border shrink-0 gap-3">
        {/* 뒤로 */}
        <button
          onClick={() => {
            if (useEditorStore.getState().isDirty && !window.confirm("저장하지 않은 변경이 있습니다. 나갈까요?")) return;
            navigate(-1);
          }}
          aria-label="뒤로"
          className="grid size-8 place-items-center bg-transparent border-none cursor-pointer rounded-lg text-muted hover:bg-subtle shrink-0"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 제목 + 저장 상태 */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {site ? (
            <div className="relative flex items-center">
              <input
                value={site.title}
                onChange={(e) => updateTitle(e.target.value)}
                aria-label="사이트 제목"
                style={{ width: 210, height: 32, paddingLeft: 10, paddingRight: 30 }}
                className="border border-border rounded-[8px] bg-field font-sub text-[14px] font-semibold outline-none focus:border-primary focus:bg-surface transition-colors"
              />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-[10px] pointer-events-none text-muted">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
          ) : (
            <span className="text-[14px] text-muted truncate">
              {loadError ? "불러오지 못했습니다" : siteId === "new" ? "새 사이트" : "로딩 중..."}
            </span>
          )}

          <span
            className={cn(
              "hidden sm:inline-flex items-center gap-1 font-body text-[12px] whitespace-nowrap shrink-0",
              saveError ? "text-danger" : isDirty || isSaving ? "text-muted" : "text-success"
            )}
          >
            {!saveError && !isDirty && !isSaving && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {saveLabel}
          </span>
        </div>

        {/* 디바이스 토글 (데스크탑만) */}
        <div className="hidden md:flex rounded-[10px] bg-subtle p-[3px] gap-[2px] shrink-0">
          <button
            onClick={() => setDevice("mobile")}
            aria-label="모바일 미리보기"
            aria-pressed={device === "mobile"}
            className={cn(
              "inline-flex items-center gap-[6px] h-7 px-[11px] border-none rounded-[7px] font-sub text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors",
              device === "mobile" ? "bg-surface text-heading shadow-sm" : "bg-transparent text-muted"
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 19h2" />
            </svg>
            모바일
          </button>
          <button
            onClick={() => setDevice("desktop")}
            aria-label="데스크탑 미리보기"
            aria-pressed={device === "desktop"}
            className={cn(
              "inline-flex items-center gap-[6px] h-7 px-[11px] border-none rounded-[7px] font-sub text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors",
              device === "desktop" ? "bg-surface text-heading shadow-sm" : "bg-transparent text-muted"
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="13" rx="2" /><path d="M9 21h6" />
            </svg>
            데스크탑
          </button>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <button
              className="jc-btn-outline"
              onClick={handleDiscard}
              disabled={isSaving || isSavingManual}
            >
              취소
            </button>
          )}
          {isDirty && (
            <button
              className="jc-btn-outline"
              onClick={handleSave}
              disabled={isSaving || isSavingManual || !site}
            >
              {isSaving || isSavingManual ? "저장 중..." : "저장"}
            </button>
          )}
          <button
            className="jc-btn-outline hidden md:inline-flex"
            onClick={() => setPreviewNonce((n) => n + 1)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" /><path d="M12 8v4l3 3" />
            </svg>
            다시 보기
          </button>
          <button
            className="jc-btn-primary"
            onClick={handlePublish}
            disabled={isPublishing || !site}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" />
            </svg>
            {isPublishing ? "..." : "공유"}
          </button>
        </div>
      </header>

      {/* ── 모바일 세그먼트 탭 ── */}
      <div className="flex md:hidden border-b border-border bg-subtle p-[3px] gap-[2px] shrink-0">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 py-[7px] border-none rounded-[7px] font-sub text-[12.5px] font-semibold cursor-pointer transition-colors",
              mobileTab === tab.id ? "bg-surface text-heading shadow-sm" : "bg-transparent text-muted"
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
            "w-full md:w-[236px] bg-surface md:border-r border-border flex-col overflow-hidden shrink-0",
            mobileTab === "pages" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-[18px] pt-[18px] pb-[10px] flex items-baseline gap-[7px]">
            <span className="font-sub text-[12px] font-bold tracking-[0.06em] text-muted">페이지</span>
            <span className="font-body text-[12px] text-muted">{slides.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 py-1">
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
          <div className="px-2.5 pb-2.5 pt-2 border-t border-border">
            <DashedButton onClick={() => setPickerOpen(true)}>페이지 추가</DashedButton>
          </div>
        </aside>

        {/* 가운데: 미리보기 */}
        <div
          className={cn(
            "flex-1 min-w-0 p-4 md:p-8 overflow-hidden jc-editor__stage",
            mobileTab === "preview" ? "flex" : "hidden md:flex"
          )}
        >
          {/*
            실측 컨테이너를 항상 마운트해 두어야 useFitScale의 ResizeObserver가
            초기 로딩 시에도 올바른 크기를 잡을 수 있다.
            조건부로 마운트하면 데이터 로드 전 useLayoutEffect 실행 시 ref가 null이어서
            scale이 1로 고정되는 버그가 발생한다.
          */}
          <div ref={previewAreaRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
            {selectedSlide && schema ? (
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
                    기기 목업 — 참고 디자인 기준.
                    모바일: 다크 케이스 + 상단 필 바, 데스크탑: 브라우저 크롬 스타일.
                  */}
                  {device === "mobile" ? (
                    <div
                      style={{
                        background: "#2B2B27",
                        borderRadius: 34,
                        padding: 9,
                        boxShadow: "0 24px 60px rgba(43,43,39,0.18)",
                      }}
                    >
                      {/* 노치 필 바 */}
                      <div
                        style={{
                          height: NOTCH_HEIGHT,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ width: 60, height: 6, borderRadius: 99, background: "rgba(244,239,228,0.35)" }} />
                      </div>
                      {/* 슬라이드 캔버스 */}
                      <div
                        style={{
                          width: stageSize.width,
                          height: stageSize.height,
                          borderRadius: 26,
                          overflow: "hidden",
                          position: "relative",
                          background: "var(--color-surface)",
                        }}
                      >
                        <SlideCanvas
                          key={`${selectedSlide.id}:${previewNonce}:${device}`}
                          slideKey={`${selectedSlide.id}:${previewNonce}:${device}`}
                          componentRef={selectedSlide.componentRef}
                          values={previewValues}
                          isPreview
                          onSkip={() => setPreviewNonce((n) => n + 1)}
                          skipLabel="다시 보기"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "0 24px 60px rgba(43,43,39,0.12)",
                      }}
                    >
                      {/* 브라우저 타이틀바 */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          height: 34,
                          padding: "0 12px",
                          background: "var(--color-subtle)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {(["#DAD1BE", "#DAD1BE", "#DAD1BE"] as const).map((c, i) => (
                          <span key={i} style={{ width: 9, height: 9, borderRadius: 99, background: c, flexShrink: 0 }} />
                        ))}
                      </div>
                      {/* 슬라이드 캔버스 */}
                      <div
                        style={{
                          width: stageSize.width,
                          height: stageSize.height,
                          overflow: "hidden",
                          position: "relative",
                          background: "var(--color-surface)",
                        }}
                      >
                        <SlideCanvas
                          key={`${selectedSlide.id}:${previewNonce}:${device}`}
                          slideKey={`${selectedSlide.id}:${previewNonce}:${device}`}
                          componentRef={selectedSlide.componentRef}
                          values={previewValues}
                          isPreview
                          onSkip={() => setPreviewNonce((n) => n + 1)}
                          skipLabel="다시 보기"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="max-w-[360px] bg-surface rounded-[14px] px-6 py-5"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <h2 className="font-sub text-[16px] font-semibold mb-2 text-heading">
                  {loadError ? "사이트를 불러오지 못했어요" : "페이지를 추가해 보세요"}
                </h2>
                <p className="font-body text-[12px] leading-relaxed mb-4 text-muted">
                  {loadError
                    ? "잠시 후 다시 시도해 주세요."
                    : "왼쪽 목록에서 '페이지 추가'를 눌러 원하는 슬라이드를 고르면 여기에서 바로 편집할 수 있어요."}
                </p>
                {!loadError && (
                  <button className="jc-btn-primary" onClick={() => setPickerOpen(true)}>
                    페이지 추가
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 편집 패널 — 스키마 순회로 자동 생성 */}
        <aside
          className={cn(
            "w-full md:w-[316px] bg-surface md:border-l border-border flex-col overflow-hidden shrink-0",
            mobileTab === "edit" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-4 py-[16px] border-b border-border flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-sub text-[11px] font-bold tracking-[0.06em] text-muted">페이지 설정</div>
              {selectedSlide && (
                <div className="mt-[3px] font-sub text-[14.5px] font-bold tracking-[-0.01em] truncate text-heading">
                  {selectedSlide.templateName}
                </div>
              )}
            </div>
            {selectedSlide && (
              <button
                onClick={() => {
                  if (!window.confirm("이 페이지의 모든 편집을 기본값으로 되돌릴까요?")) return;
                  resetSlideOverrides(selectedSlide.id);
                }}
                className="font-body text-[12px] text-muted hover:text-heading border border-border rounded-[8px] px-[9px] py-[3px] shrink-0 cursor-pointer bg-surface hover:bg-subtle transition-colors flex-none"
              >
                초기화
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
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
              <p className="font-body text-[12px] text-muted leading-relaxed">
                편집할 페이지를 선택해 주세요.
              </p>
            )}
          </div>

          {/* 공유 CTA */}
          <div className="px-4 py-4 border-t border-border bg-surface shrink-0">
            <button
              className="jc-btn-primary w-full justify-center"
              onClick={handlePublish}
              disabled={isPublishing || !site}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" />
              </svg>
              {isPublishing ? "링크 생성 중..." : "링크 만들어 공유"}
            </button>
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
