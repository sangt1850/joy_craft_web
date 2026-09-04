// TemplatePreviewModal — 템플릿 실제 슬라이드 미리보기 오버레이
// PC / 모바일 뷰포트 전환 + 닫기 버튼
//
// 슬라이드는 고정 px 패딩·폰트를 쓰므로 컨테이너 크기가 달라지면 비율이 깨진다.
// PlayerPage(460×900) 해상도를 캔버스 기준으로 잡고, 기기 크롬(노치/홈바)은 그 바깥에
// 추가한 뒤 전체를 transform:scale()로 축소/확대한다 (에디터와 동일 전략).
import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
import NeoButton from "./NeoButton";
import StatusBadge from "./StatusBadge";
import SlideCanvas from "../player/SlideCanvas";
import { fetchTemplateDetail } from "../../api/templates";
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

/** 컨테이너 실측 크기에 맞춰 디자인 해상도를 transform:scale 로 맞춘다 */
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

export default function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  const [viewport, setViewport] = useState<Viewport>("mobile");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [slideKey, setSlideKey] = useState(0);

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
      style={{ backgroundColor: "rgba(17,17,17,0.82)" }}
      onClick={onClose}
    >
      {/* 모달 패널 */}
      <div
        className="neo-border bg-bg flex flex-col"
        style={{
          width: "min(calc(100vw - 32px), 980px)",
          maxHeight: "calc(100dvh - 40px)",
          boxShadow: "8px 8px 0 #111",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 상단 바 ── */}
        <div
          className="flex items-center gap-3 px-5 py-3 neo-border"
          style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <StatusBadge variant="default">미리보기</StatusBadge>
            <span className="font-headline text-[15px] truncate">{template.name}</span>
            {isPro && <span className="pixel-badge-pro shrink-0">PRO</span>}
          </div>

          <div className="flex neo-border overflow-hidden shrink-0" style={{ boxShadow: "3px 3px 0 #111" }}>
            <ViewportBtn label="💻 PC" active={viewport === "pc"} onClick={() => setViewport("pc")} />
            <ViewportBtn label="📱 모바일" active={viewport === "mobile"} onClick={() => setViewport("mobile")} borderLeft />
          </div>

          <NeoButton bg="var(--color-ink)" color="#fff7e6" size="sm" shadow={3} onClick={onClose}>
            ✕ 닫기
          </NeoButton>
        </div>

        {/* ── 콘텐츠 영역 ── */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden bg-[#E8E0D4]"
          style={{ padding: "16px 24px" }}
        >
          {state.status === "loading" && (
            <div className="font-pixel text-[#888] text-[11px]">불러오는 중...</div>
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
        <div
          className="flex items-center justify-between px-5 py-3 neo-border"
          style={{ borderBottom: "none", borderLeft: "none", borderRight: "none" }}
        >
          <span className="font-body text-[12px] text-[#555]">
            {template.category}
            {template.description ? ` · ${template.description}` : ""}
          </span>
          <div className="flex gap-2">
            <NeoButton bg="var(--color-bg)" size="sm" shadow={3} onClick={onClose}>
              닫기
            </NeoButton>
            <NeoButton
              bg={isPro ? "var(--color-secondary)" : "var(--color-primary)"}
              color={isPro ? "#111" : "#fff"}
              size="sm"
              shadow={3}
            >
              {isPro ? "🔒 PRO 구독하기" : "내 사이트에 담기"}
            </NeoButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 기기 토글 버튼 ────────────────────────────────────────────────────────────
function ViewportBtn({
  label,
  active,
  onClick,
  borderLeft,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  borderLeft?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="font-sub text-[12px] px-3.5 py-1.5 transition-colors cursor-pointer"
      style={{
        background: active ? "#111" : "#fff7e6",
        color: active ? "#fff7e6" : "#111",
        borderLeft: borderLeft ? "3px solid #111" : undefined,
      }}
    >
      {label}
    </button>
  );
}
