// TemplateCard — 템플릿/갤러리 카드 (BrowsePage, LandingPage 공통)
// 이모지 썸네일 + PRO 배지 + 제목 + 사용 버튼
import NeoButton from "./NeoButton";

interface TemplateCardProps {
  id: string | number;
  title: string;
  emoji?: string;
  price?: "FREE" | "PRO";
  bg?: string;            // Tailwind 클래스 (e.g. "bg-peach")
  subLabel?: string;      // 부가 텍스트 (e.g. "3페이지 · 인터랙티브")
  thumbHeight?: number;
  onUse?: (id: string | number) => void;
  onPreview?: (id: string | number) => void;
  showButton?: boolean;
}

export default function TemplateCard({
  id,
  title,
  emoji = "🎁",
  price = "FREE",
  bg = "bg-cream",
  subLabel,
  thumbHeight = 130,
  onUse,
  onPreview,
  showButton = true,
}: TemplateCardProps) {
  const isPro = price === "PRO";

  return (
    <div
      className={`neo-border overflow-hidden neo-card-lift ${bg}`}
      style={{ "--neo-shadow": "5px" } as React.CSSProperties}
    >
      {/* 썸네일 */}
      <div
        className="bg-black/[0.08] flex items-center justify-center text-[48px] relative group"
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
              className="font-sub text-cream neo-border px-3 py-1.5"
              style={{ fontSize: 12, background: "#111", boxShadow: "3px 3px 0 #555" }}
            >
              🔍 미리보기
            </span>
          </button>
        )}
      </div>

      {/* 본문 */}
      <div className="p-4">
        <div className="font-headline text-[14px] leading-tight mb-1">{title}</div>

        {subLabel && (
          <div className="font-body text-[12px] text-[#333] mb-3">{subLabel}</div>
        )}

        {showButton && (
          <div className={`flex flex-col gap-2 ${subLabel ? "" : "mt-3"}`}>
            {onPreview && (
              <NeoButton
                bg="var(--color-cream)"
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
              bg={isPro ? "var(--color-mustard)" : "#111"}
              color={isPro ? "#111" : "#FFF7E6"}
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
