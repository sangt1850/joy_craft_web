// 크리에이터 슬라이드 기본값 편집기
//
// 등록한 슬라이드 템플릿의 이름·설명·기본값(defaultValues)을 수정하는 화면.
// 레이아웃은 SiteEditorPage와 동일: 좌측 목록 / 중앙 미리보기 / 우측 편집 패널.
// 차이점: overrides 개념 없이 defaultValues 자체를 직접 수정한다.
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import SlideCanvas from "../../components/player/SlideCanvas";
import SlideFieldsPanel from "../../components/editor/SlideFieldsPanel";
import {
  resolveEditorSchema,
  fillMissingWithDefaults,
} from "../../slides/schemaAdapter";
import { resolveAssetRefsDeep } from "../../api/assets";
import {
  fetchMyTemplates,
  fetchMyTemplateDetail,
  updateMyTemplate,
} from "../../api/creator";
import type { TemplateListResponse, TemplateDetailResponse } from "../../types/api";

type MobileTab = "list" | "preview" | "edit";

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: "list", label: "목록" },
  { id: "preview", label: "미리보기" },
  { id: "edit", label: "기본값" },
];

const STAGE = { width: 320, height: 568 } as const;
const MOBILE_CASE_PAD = 9;
const NOTCH_HEIGHT = 28;

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

export default function TemplateEditPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<TemplateListResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(templateId ?? null);
  const [detail, setDetail] = useState<TemplateDetailResponse | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");

  const designWidth = STAGE.width + MOBILE_CASE_PAD * 2;
  const designHeight = NOTCH_HEIGHT + STAGE.height + MOBILE_CASE_PAD * 2;
  const { containerRef: previewAreaRef, scale } = useFitScale(designWidth, designHeight);

  // 목록 로드 — 처음 한 번
  useEffect(() => {
    fetchMyTemplates()
      .then((list) => {
        setTemplates(list);
        if (!selectedId && list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {
        // 목록 로드 실패는 빈 목록으로 처리
      })
      .finally(() => setLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 상세 로드 — selectedId가 바뀔 때
  useEffect(() => {
    if (!selectedId) return;
    setLoadingDetail(true);
    setDetail(null);
    setIsDirty(false);
    setSaveError(false);
    fetchMyTemplateDetail(selectedId)
      .then((d) => {
        setDetail(d);
        setEditedValues(d.defaultValues ?? {});
        setEditedName(d.name);
        setEditedDescription(d.description ?? "");
      })
      .catch(() => {
        setDetail(null);
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const schema = useMemo(
    () => (detail ? resolveEditorSchema(detail.componentRef, undefined) : null),
    [detail]
  );

  const editorValues = useMemo(
    () => (schema ? fillMissingWithDefaults(schema, editedValues) : editedValues),
    [schema, editedValues]
  );

  const previewValues = useMemo(
    () => resolveAssetRefsDeep(editorValues),
    [editorValues]
  );

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveError(false);
  }, []);

  const handleSave = async () => {
    if (!selectedId || !detail) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const updated = await updateMyTemplate(selectedId, {
        name: editedName,
        description: editedDescription,
        defaultValues: editedValues,
      });
      setDetail(updated);
      // 목록의 이름도 반영
      setTemplates((prev) =>
        prev.map((t) => (t.id === selectedId ? { ...t, name: updated.name, description: updated.description } : t))
      );
      setIsDirty(false);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!detail) return;
    if (!window.confirm("편집 중인 내용을 취소하고 마지막 저장 상태로 되돌릴까요?")) return;
    setEditedValues(detail.defaultValues ?? {});
    setEditedName(detail.name);
    setEditedDescription(detail.description ?? "");
    setIsDirty(false);
    setSaveError(false);
  };

  const handleResetToSchemaDefaults = () => {
    if (!schema) return;
    if (!window.confirm("모든 필드를 스키마 기본값으로 초기화할까요?")) return;
    const defaults: Record<string, unknown> = {};
    for (const f of schema.fields) defaults[f.key] = f.default;
    setEditedValues(defaults);
    setIsDirty(true);
    setSaveError(false);
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
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          className="grid size-8 place-items-center bg-transparent border-none cursor-pointer rounded-lg text-muted hover:bg-subtle shrink-0"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 제목 + 뱃지 + 저장 상태 */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="font-sub text-[14px] font-semibold text-heading truncate hidden sm:block">
            내 슬라이드 관리
          </span>
          <span className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-full font-sub text-[10px] font-semibold bg-selected text-primary border border-primary/20 shrink-0 whitespace-nowrap">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            기본값 편집
          </span>
          <span
            className={cn(
              "hidden sm:inline-flex items-center gap-1 font-body text-[12px] whitespace-nowrap shrink-0",
              saveError ? "text-danger" : isDirty || isSaving ? "text-muted" : detail ? "text-success" : "text-muted"
            )}
          >
            {!saveError && !isDirty && !isSaving && detail && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {detail ? saveLabel : ""}
          </span>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <button
              className="jc-btn-outline"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              취소
            </button>
          )}
          <button
            className="jc-btn-outline hidden md:inline-flex"
            onClick={() => setPreviewNonce((n) => n + 1)}
            disabled={!detail}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" /><path d="M12 8v4l3 3" />
            </svg>
            다시 보기
          </button>
          <button
            className="jc-btn-primary"
            onClick={handleSave}
            disabled={isSaving || !isDirty || !detail}
          >
            {isSaving ? "저장 중..." : "저장"}
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
        {/* 좌측: 슬라이드 목록 */}
        <aside
          className={cn(
            "w-full md:w-[236px] bg-surface md:border-r border-border flex-col overflow-hidden shrink-0",
            mobileTab === "list" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-[18px] pt-[18px] pb-[10px] flex items-baseline gap-[7px]">
            <span className="font-sub text-[12px] font-bold tracking-[0.06em] text-muted">내 슬라이드</span>
            {!loadingList && (
              <span className="font-body text-[12px] text-muted">{templates.length}</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 py-1">
            {loadingList ? (
              <div className="px-3 py-4 text-center">
                <span className="font-body text-[12px] text-muted animate-pulse">불러오는 중...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="font-body text-[12px] text-muted leading-relaxed">등록된 슬라이드가 없습니다.</p>
              </div>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedId(t.id);
                    setMobileTab("preview");
                  }}
                  className={cn(
                    "w-full text-left rounded-[10px] px-3 py-[10px] mb-[3px] border-none cursor-pointer transition-colors",
                    selectedId === t.id
                      ? "bg-selected text-heading"
                      : "bg-transparent text-muted hover:bg-subtle hover:text-heading"
                  )}
                >
                  <div className="font-sub text-[12.5px] font-semibold truncate">{t.name}</div>
                  {t.description && (
                    <div className="mt-[2px] font-body text-[11px] text-muted truncate">{t.description}</div>
                  )}
                  <div className="mt-[4px] flex items-center gap-2">
                    <span className="font-body text-[10px] text-muted">{t.category}</span>
                    {t.pricing === "premium" && (
                      <span className="font-body text-[10px] font-semibold text-primary">PRO</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* 가운데: 미리보기 */}
        <div
          className={cn(
            "flex-1 min-w-0 p-4 md:p-8 overflow-hidden jc-editor__stage",
            mobileTab === "preview" ? "flex" : "hidden md:flex"
          )}
        >
          <div ref={previewAreaRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
            {loadingDetail ? (
              <span className="font-body text-[12px] text-muted animate-pulse">슬라이드를 불러오는 중...</span>
            ) : detail && schema ? (
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
                  {/* 모바일 케이스 목업 */}
                  <div
                    style={{
                      background: "#2B2B27",
                      borderRadius: 34,
                      padding: MOBILE_CASE_PAD,
                      boxShadow: "0 24px 60px rgba(43,43,39,0.18)",
                    }}
                  >
                    {/* 노치 바 */}
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
                        width: STAGE.width,
                        height: STAGE.height,
                        borderRadius: 26,
                        overflow: "hidden",
                        position: "relative",
                        background: "var(--color-surface)",
                      }}
                    >
                      <SlideCanvas
                        key={`${detail.id}:${previewNonce}`}
                        slideKey={`${detail.id}:${previewNonce}`}
                        componentRef={detail.componentRef}
                        values={previewValues}
                        isPreview
                        onSkip={() => setPreviewNonce((n) => n + 1)}
                        skipLabel="다시 보기"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="max-w-[360px] bg-surface rounded-[14px] px-6 py-5"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <h2 className="font-sub text-[16px] font-semibold mb-2 text-heading">
                  슬라이드를 선택해 주세요
                </h2>
                <p className="font-body text-[12px] leading-relaxed text-muted">
                  왼쪽 목록에서 편집할 슬라이드를 선택하면 기본값을 수정할 수 있어요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 기본값 편집 패널 */}
        <aside
          className={cn(
            "w-full md:w-[316px] bg-surface md:border-l border-border flex-col overflow-hidden shrink-0",
            mobileTab === "edit" ? "flex" : "hidden md:flex"
          )}
        >
          {detail ? (
            <>
              {/* 패널 헤더 */}
              <div className="px-4 py-[14px] border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-2 mb-[10px]">
                  <div className="min-w-0">
                    <div className="font-sub text-[11px] font-bold tracking-[0.06em] text-muted">페이지 기본값</div>
                    <div className="mt-[3px] font-sub text-[14.5px] font-bold tracking-[-0.01em] truncate text-heading">
                      {editedName || detail.name}
                    </div>
                  </div>
                  <button
                    onClick={handleResetToSchemaDefaults}
                    className="font-body text-[12px] text-muted hover:text-heading border border-border rounded-[8px] px-[9px] py-[3px] shrink-0 cursor-pointer bg-surface hover:bg-subtle transition-colors flex-none"
                  >
                    초기화
                  </button>
                </div>
                {/* 안내 배너 */}
                <div
                  className="rounded-[8px] px-3 py-2"
                  style={{ background: "var(--color-field)", border: "1px solid var(--color-border)" }}
                >
                  <p className="font-body text-[11px] text-muted leading-snug">
                    여기서 변경한 값은 사용자가 이 페이지를 새로 추가할 때 보이는 기본값이 됩니다.
                  </p>
                </div>
              </div>

              {/* 편집 영역 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* 이름 / 설명 섹션 */}
                <div className="flex flex-col gap-[14px] pb-[22px] border-b border-border mb-[22px]">
                  <div>
                    <label className="block font-sub text-[10px] font-bold tracking-[0.06em] text-muted mb-[6px]">
                      페이지 이름
                    </label>
                    <input
                      value={editedName}
                      onChange={(e) => {
                        setEditedName(e.target.value);
                        setIsDirty(true);
                        setSaveError(false);
                      }}
                      className="w-full border border-border rounded-[8px] bg-field font-body text-[13px] px-[10px] py-[7px] outline-none focus:border-primary transition-colors"
                      placeholder="페이지 이름"
                    />
                  </div>
                  <div>
                    <label className="block font-sub text-[10px] font-bold tracking-[0.06em] text-muted mb-[6px]">
                      설명 <span className="font-normal opacity-60">(선택)</span>
                    </label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => {
                        setEditedDescription(e.target.value);
                        setIsDirty(true);
                        setSaveError(false);
                      }}
                      rows={2}
                      className="w-full border border-border rounded-[8px] bg-field font-body text-[13px] px-[10px] py-[7px] outline-none focus:border-primary transition-colors resize-none"
                      placeholder="이 페이지에 대한 짧은 설명"
                    />
                  </div>
                </div>

                {/* 기본값 필드 */}
                {schema ? (
                  <SlideFieldsPanel
                    key={detail.id}
                    schema={schema}
                    values={editorValues}
                    defaultValues={detail.defaultValues}
                    onChange={handleFieldChange}
                  />
                ) : (
                  <p className="font-body text-[12px] text-muted">
                    이 슬라이드의 편집 스키마를 찾지 못했습니다.
                  </p>
                )}
              </div>

              {/* 저장 CTA */}
              <div className="px-4 py-4 border-t border-border bg-surface shrink-0">
                {saveError && (
                  <p className="font-body text-[11px] text-danger mb-2">
                    저장에 실패했습니다. 잠시 후 다시 시도해 주세요.
                  </p>
                )}
                <button
                  className="jc-btn-primary w-full justify-center"
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {isSaving ? "저장 중..." : "기본값 저장"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-start px-4 py-4">
              <p className="font-body text-[12px] text-muted leading-relaxed">
                {loadingDetail ? "불러오는 중..." : "편집할 슬라이드를 선택해 주세요."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
