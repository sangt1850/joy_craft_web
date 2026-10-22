// LiveThumbnail — 슬라이드 전체를 비율 그대로 보여주는 썸네일.
// viewport prop으로 mobile(320×568 세로) / pc(720×460 가로) 전환 가능.
import { useLayoutEffect, useState } from "react";
import ThumbnailSlideCanvas from "./ThumbnailSlideCanvas";
import { useLiveThumbnail } from "../../hooks/useLiveThumbnail";

const STAGE = {
  mobile: { w: 320, h: 568 },
  pc:     { w: 720, h: 460 },
} as const;

export type ThumbViewport = "mobile" | "pc";

interface LiveThumbnailProps {
  templateId: string;
  viewport?: ThumbViewport;
  emoji?: string;
  /** Tailwind 배경 클래스 (idle/loading 상태에 적용) */
  bg?: string;
  /** 정적 첫 프레임 이미지 URL — idle 상태에 이미지로 표시, null이면 emoji */
  thumbnailUrl?: string | null;
  onPreview?: () => void;
  isPro?: boolean;
}

export default function LiveThumbnail({
  templateId,
  viewport = "mobile",
  emoji = "🎁",
  bg = "bg-surface",
  thumbnailUrl,
  onPreview,
  isPro,
}: LiveThumbnailProps) {
  const { phase, componentRef, slideValues, slideKey, onMouseEnter, onMouseLeave, ioRef } =
    useLiveThumbnail(templateId);

  const [containerWidth, setContainerWidth] = useState(200);

  useLayoutEffect(() => {
    const el = ioRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth || 200);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { w: slideW, h: slideH } = STAGE[viewport];
  const scale = containerWidth / slideW;
  const aspectPadding = `${(slideH / slideW) * 100}%`;
  const isActive = phase === "active" && componentRef && slideValues;

  return (
    <div
      ref={ioRef}
      className="relative group w-full"
      style={{ paddingBottom: aspectPadding }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="absolute inset-0">

        {/* idle / error — thumbnailUrl 이미지 우선, 없으면 emoji */}
        {(phase === "idle" || phase === "error") && (
          thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover select-none"
              draggable={false}
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center text-[48px] select-none ${bg}`}>
              {emoji}
            </div>
          )
        )}

        {/* loading */}
        {phase === "loading" && (
          <div className={`absolute inset-0 ${bg} animate-pulse flex items-center justify-center`}>
            <span className="font-pixel text-[10px] text-[#aaa]">●●●</span>
          </div>
        )}

        {/* active: 항상 렌더. paused=true → jc-thumb-paused로 첫 프레임 정지.
            slideKey 변경 시 React가 remount → JS 애니메이션도 처음부터 리셋 */}
        {isActive && (
          <div
            key={slideKey}
            style={{
              width: slideW,
              height: slideH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          >
            <ThumbnailSlideCanvas
              slideKey={`thumb-${templateId}-${viewport}`}
              componentRef={componentRef}
              values={slideValues}
            />
          </div>
        )}

        {isPro && (
          <span className="pixel-badge-pro absolute top-2.5 right-2.5 z-10">PRO</span>
        )}

        {onPreview && (
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
            style={{ background: "rgba(17,17,17,0.55)" }}
          >
            <span
              className="font-sub text-bg neo-border px-3 py-1.5"
              style={{ fontSize: 12, background: "#111", boxShadow: "3px 3px 0 #555" }}
            >
              미리보기
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
