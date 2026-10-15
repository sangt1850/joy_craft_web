// SiteCard — 사이트 목록 카드 (DashboardPage, MySitesPage 공통)
// 썸네일 + 제목 + 상태 배지 + 편집/공유 버튼
import { useLayoutEffect, useState } from "react";
import NeoButton from "./NeoButton";
import StatusBadge, { inferVariant } from "./StatusBadge";
import ThumbnailSlideCanvas from "./ThumbnailSlideCanvas";
import { useSiteLiveThumbnail } from "../../hooks/useSiteLiveThumbnail";
import type { ThumbViewport } from "./LiveThumbnail";

const STAGE = {
  mobile: { w: 320, h: 568 },
  pc:     { w: 720, h: 460 },
} as const;

// 사이트 라이브 썸네일 영역 — 훅을 별도 컴포넌트로 분리해야 조건부 훅 규칙을 지킬 수 있다
function SiteLiveThumb({
  siteId,
  viewport,
  bg,
  emoji,
}: {
  siteId: string;
  viewport: ThumbViewport;
  bg: string;
  emoji: string;
}) {
  const { phase, componentRef, slideValues, slideKey, onMouseEnter, onMouseLeave, ioRef } = useSiteLiveThumbnail(siteId);
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
    <div ref={ioRef} className="relative w-full" style={{ paddingBottom: aspectPadding }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="absolute inset-0">
        {(phase === "idle" || phase === "error") && (
          <div className={`absolute inset-0 flex items-center justify-center text-[44px] select-none ${bg}`}>
            {emoji}
          </div>
        )}
        {phase === "loading" && (
          <div className={`absolute inset-0 ${bg} animate-pulse flex items-center justify-center`}>
            <span className="font-pixel text-[10px] text-[#aaa]">●●●</span>
          </div>
        )}
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
              slideKey={`site-thumb-${siteId}-${viewport}`}
              componentRef={componentRef}
              values={slideValues}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SiteCardProps {
  id: string | number;
  title: string;
  pages: number;
  status: string;       // "공개" | "초안" | 등
  bg?: string;          // Tailwind 클래스 (e.g. "bg-accent")
  emoji?: string;
  thumbHeight?: number;
  enableLiveThumb?: boolean;
  liveThumbViewport?: ThumbViewport;
  onEdit?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
  /** 넘기면 카드에 삭제 버튼이 노출된다 */
  onDelete?: (id: string | number) => void;
}

export default function SiteCard({
  id,
  title,
  pages,
  status,
  bg = "bg-bg",
  emoji = "🎁",
  thumbHeight = 130,
  enableLiveThumb = false,
  liveThumbViewport = "mobile",
  onEdit,
  onShare,
  onDelete,
}: SiteCardProps) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-border bg-surface transition-shadow hover:shadow-md"
    >
      {/* 썸네일 */}
      {enableLiveThumb ? (
        <SiteLiveThumb
          siteId={String(id)}
          viewport={liveThumbViewport}
          bg={bg}
          emoji={emoji}
        />
      ) : (
        <div
          className={`flex items-center justify-center text-[44px] ${bg}`}
          style={{ height: thumbHeight }}
        >
          {emoji}
        </div>
      )}

      {/* 본문 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1.5 gap-2">
          <span className="font-headline text-[14px] leading-tight">{title}</span>
          <StatusBadge variant={inferVariant(status)}>{status}</StatusBadge>
        </div>

        <div className="font-body text-[11px] text-muted mb-3">{pages}페이지</div>

        <div className="flex gap-2 flex-wrap">
          <NeoButton
            size="sm"
            shadow={3}
            onClick={() => onEdit?.(id)}
          >
            편집
          </NeoButton>
          <NeoButton
            bg="var(--color-bg)"
            color="#111"
            size="sm"
            shadow={3}
            onClick={() => onShare?.(id)}
          >
            공유
          </NeoButton>
          {onDelete && (
            <NeoButton
              bg="var(--color-surface)"
              color="#111"
              size="sm"
              shadow={3}
              onClick={() => onDelete(id)}
            >
              삭제
            </NeoButton>
          )}
        </div>
      </div>
    </div>
  );
}
