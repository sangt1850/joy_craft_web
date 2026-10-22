// TemplatePreviewModal — 템플릿 실제 슬라이드 미리보기 오버레이
// PC / 모바일 뷰포트 전환 + 닫기 버튼
//
// 슬라이드는 고정 px 패딩·폰트를 쓰므로 컨테이너 크기가 달라지면 비율이 깨진다.
// PlayerPage(460×900) 해상도를 캔버스 기준으로 잡고, 기기 크롬(노치/홈바)은 그 바깥에
// 추가한 뒤 전체를 transform:scale()로 축소/확대한다 (에디터와 동일 전략).
import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "./NeoButton";
import StatusBadge from "./StatusBadge";
import SlideCanvas from "../player/SlideCanvas";
import { fetchTemplateDetail } from "../../api/templates";
import { addSlide } from "../../api/editor";
import { createSite } from "../../api/sites";
import { resolveSlideSchema } from "../../slides/registry";
import { fillMissingWithDefaults } from "../../slides/schemaAdapter";
import type { TemplateListResponse, TemplateDetailResponse } from "../../types/api";

type Viewport = "pc" | "mobile";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; detail: TemplateDetailResponse };

interface TemplatePreviewModalProps {
  template: TemplateListResponse;
  onClose: () => void;
}

/** 에디터와 동일한 스테이지 크기 */
const STAGE = {
  mobile:  { width: 320, height: 568 },
  pc:      { width: 720, height: 460 },
} as const;

/** 모바일 노치 바 높이 — 에디터와 동일 */
const NOTCH_H = 28;

/**
 * 컨테이너 실측 크기에 맞춰 디자인 해상도를 transform:scale 로 맞춘다.
 * scale은 1을 초과하지 않는다 — 원본보다 확대하면 슬라이드가 컨테이너를 벗어난다.
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
      setScale(Math.min(1, width / designWidth, height / designHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth, designHeight]);

  return { containerRef, scale };
}

export default function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  const navigate = useNavigate();
  const [viewport, setViewport] = useState<Viewport>("mobile");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [slideKey, setSlideKey] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // 뷰포트 전환 시 슬라이드를 처음부터 재시작
  const handleViewport = useCallback((v: Viewport) => {
    setViewport(v);
    setSlideKey((k) => k + 1);
  }, []);

  const stageSize = STAGE[viewport];
  const designWidth = stageSize.width;
  const designHeight = stageSize.height + (viewport === "mobile" ? NOTCH_H : 0);
  const { containerRef, scale } = useFitScale(designWidth, designHeight);

  // 템플릿 상세 로드
  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    fetchTemplateDetail(template.id)
      .then((detail) => { if (alive) setState({ status: "ready", detail }); })
      .catch(() => { if (alive) setState({ status: "error" }); });
    return () => { alive = false; };
  }, [template.id]);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 슬라이드 완료 시 처음부터 재시작
  const handleRestart = useCallback(() => setSlideKey((k) => k + 1), []);

  const handleAddToSite = useCallback(async () => {
    setIsAdding(true);
    try {
      const site = await createSite("새 사이트");
      await addSlide(site.id, String(template.id));
      navigate(`/editor/${site.id}`);
      onClose();
    } catch {
      alert("사이트에 추가하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsAdding(false);
    }
  }, [template.id, navigate, onClose]);

  // 에디터와 동일하게 빠진 필드를 로컬 스키마 기본값으로 채운다.
  // DB defaultValues에 없는 필드(backgroundColor 등)가 undefined로 들어가면
  // 슬라이드 CSS가 깨진다 (예: gradient에 undefined가 들어감).
  const previewValues = useMemo(() => {
    if (state.status !== "ready") return {};
    const { componentRef, defaultValues } = state.detail;
    const localSchema = resolveSlideSchema(componentRef);
    return localSchema
      ? fillMissingWithDefaults(localSchema, defaultValues)
      : defaultValues;
  }, [state]);

  const isPro = template.pricing !== "free";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(48,44,58,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* 모달 패널 */}
      <div
        className="border border-border rounded-[16px] overflow-hidden bg-surface flex flex-col"
        style={{
          width: "min(calc(100vw - 24px), 1100px)",
          maxHeight: "calc(100dvh - 24px)",
          boxShadow: "0 24px 70px rgba(57,40,66,.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 상단 바 ── */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b border-border"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <StatusBadge variant="default">미리보기</StatusBadge>
            <span className="font-headline text-[15px] truncate">{template.name}</span>
            {isPro && <span className="pixel-badge-pro shrink-0">PRO</span>}
          </div>

          <div className="flex rounded-[11px] bg-selected p-1 overflow-hidden shrink-0">
            <ViewportBtn label="가로" orientation="landscape" active={viewport === "pc"} onClick={() => handleViewport("pc")} />
            <ViewportBtn label="세로" orientation="portrait" active={viewport === "mobile"} onClick={() => handleViewport("mobile")} borderLeft />
          </div>

          <NeoButton bg="var(--color-primary)" color="#fff" size="sm" shadow={0} onClick={onClose}>
            ✕ 닫기
          </NeoButton>
        </div>

        {/* ── 콘텐츠 영역 ── */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden bg-bg"
          style={{ padding: "12px 16px" }}
        >
          {state.status === "loading" && (
            <div className="font-body text-muted text-[12px]">불러오는 중...</div>
          )}

          {state.status === "error" && (
            <div className="font-body text-[#aaa] text-[13px] text-center">
              <div className="mb-2">미리보기를 불러오지 못했습니다.</div>
              <NeoButton
                bg="var(--color-secondary)"
                size="sm"
                shadow={3}
                onClick={() => {
                  setState({ status: "loading" });
                  fetchTemplateDetail(template.id)
                    .then((detail) => setState({ status: "ready", detail }))
                    .catch(() => setState({ status: "error" }));
                }}
              >
                다시 시도
              </NeoButton>
            </div>
          )}

          {state.status === "ready" && (
            <div ref={containerRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
              <div className="shrink-0" style={{ width: designWidth * scale, height: designHeight * scale }}>
                <div
                  style={{
                    width: designWidth,
                    height: designHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <div
                    style={{
                      borderRadius: viewport === "mobile" ? 14 : 4,
                      boxShadow:
                        "0 1px 2px rgba(17,17,17,0.08), 0 8px 16px -4px rgba(17,17,17,0.18), 0 28px 48px -12px rgba(17,17,17,0.38)",
                    }}
                  >
                    {viewport === "mobile" && (
                      <div className="bg-ink h-7 rounded-t-xl border-[3px] border-b-0 border-ink flex items-center justify-center">
                        <div className="w-[60px] h-1.5 bg-white/30 rounded-full" />
                      </div>
                    )}
                    <div
                      className={`neo-border-4 bg-bg relative overflow-hidden ${viewport === "mobile" ? "rounded-b-xl" : ""}`}
                      style={{ width: stageSize.width, height: stageSize.height }}
                    >
                      <SlideCanvas
                        slideKey={`preview-${template.id}-${slideKey}-${viewport}`}
                        componentRef={state.detail.componentRef}
                        values={previewValues}
                        isPreview={true}
                        onComplete={handleRestart}
                        onSkip={handleRestart}
                        skipLabel="처음부터"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 하단 액션 바 ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="font-body text-[12px] text-muted">
            {template.category}
            {template.description ? ` · ${template.description}` : ""}
          </span>
          <div className="flex gap-2">
            <NeoButton bg="var(--color-bg)" size="sm" shadow={3} onClick={onClose}>
              닫기
            </NeoButton>
            <NeoButton
              bg={isPro ? "var(--color-secondary)" : "var(--color-primary)"}
              color="#fff"
              size="sm"
              shadow={3}
              onClick={isPro ? undefined : handleAddToSite}
              disabled={isPro || isAdding}
            >
              {isPro ? "🔒 PRO 구독하기" : isAdding ? "추가 중..." : "내 사이트에 담기"}
            </NeoButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 방향 토글 버튼 ────────────────────────────────────────────────────────────
function ViewportBtn({
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
      className="font-sub text-[11px] flex items-center gap-1.5 px-3 py-1.5 transition-colors cursor-pointer"
      style={{
        background: active ? "#fff" : "transparent",
        color,
        borderLeft: borderLeft ? "1px solid var(--color-border)" : undefined,
      }}
    >
      {/* 화면 방향 아이콘 */}
      {orientation === "landscape" ? (
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke={color} strokeWidth="1.5" />
          <rect x="2" y="2" width="12" height="8" rx="0.5" fill={color} opacity="0.25" />
        </svg>
      ) : (
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
          <rect x="0.5" y="0.5" width="9" height="15" rx="1.5" stroke={color} strokeWidth="1.5" />
          <rect x="3.5" y="1.5" width="3" height="1" rx="0.5" fill={color} opacity="0.5" />
          <rect x="2" y="4" width="6" height="9" rx="0.5" fill={color} opacity="0.25" />
        </svg>
      )}
      {label}
    </button>
  );
}
