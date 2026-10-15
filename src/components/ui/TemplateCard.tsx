// TemplateCard — 템플릿/갤러리 카드 (BrowsePage, LandingPage 공통)
// 이모지 썸네일 + PRO 배지 + 제목 + 사용 버튼
import NeoButton from "./NeoButton";
import LiveThumbnail, { type ThumbViewport } from "./LiveThumbnail";

interface TemplateCardProps {
  id: string | number;
  title: string;
  emoji?: string;
  price?: "FREE" | "PRO";
  bg?: string;            // Tailwind 클래스 (e.g. "bg-surface")
  subLabel?: string;      // 부가 텍스트 (e.g. "3페이지 · 인터랙티브")
  thumbHeight?: number;
  /** hover 전 정적 첫 프레임 이미지 */
  thumbnailUrl?: string | null;
  onUse?: (id: string | number) => void;
  onPreview?: (id: string | number) => void;
  showButton?: boolean;
  enableLiveThumb?: boolean;
  liveThumbViewport?: ThumbViewport;
}

export default function TemplateCard({
  id,
  title,
  emoji = "🎁",
  price = "FREE",
  bg = "bg-bg",
  subLabel,
  thumbHeight = 130,
  thumbnailUrl,
  onUse,
  onPreview,
  showButton = true,
  enableLiveThumb = false,
  liveThumbViewport = "mobile",
}: TemplateCardProps) {
  const isPro = price === "PRO";

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-border bg-surface transition-shadow hover:shadow-md"
    >
      {/* 썸네일 */}
      {enableLiveThumb ? (
        <LiveThumbnail
          templateId={String(id)}
          viewport={liveThumbViewport}
          emoji={emoji}
          bg={bg}
          thumbnailUrl={thumbnailUrl}
          isPro={isPro}
          onPreview={onPreview ? () => onPreview(id) : undefined}
        />
      ) : (
        <div
          className={`flex items-center justify-center text-[48px] relative group ${bg}`}
          style={{ height: thumbHeight }}
        >
          {emoji}
          {isPro && (
            <span className="pixel-badge-pro absolute top-2.5 right-2.5">PRO</span>
          )}
          {/* 미리보기 버튼 — 호버 시 노출 */}
          {onPreview && (
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(id); }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: "rgba(17,17,17,0.55)" }}
            >
              <span
                className="font-sub text-white rounded-lg px-3 py-1.5"
                style={{ fontSize: 12, background: "var(--color-primary)" }}
              >
                미리보기
              </span>
            </button>
          )}
        </div>
      )}

      {/* 본문 */}
      <div className="p-4">
        <div className="font-headline text-[14px] leading-tight mb-1">{title}</div>

        {subLabel && (
          <div className="font-body text-[12px] text-muted mb-3">{subLabel}</div>
        )}

        {showButton && (
          <div className={`flex flex-col gap-2 ${subLabel ? "" : "mt-3"}`}>
            {onPreview && (
              <NeoButton
                bg="var(--color-bg)"
                color="#111"
                size="sm"
                shadow={3}
                block
                onClick={() => onPreview(id)}
              >
                🔍 미리보기
              </NeoButton>
            )}
            <NeoButton
              bg={isPro ? "var(--color-secondary)" : "var(--color-primary)"}
              color="#fff"
              size="sm"
              shadow={3}
              block
              onClick={() => onUse?.(id)}
            >
              {isPro ? "🔒 PRO" : "내 사이트에 담기"}
            </NeoButton>
          </div>
        )}
      </div>
    </div>
  );
}
