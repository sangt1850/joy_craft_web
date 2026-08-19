// SiteCard — 사이트 목록 카드 (DashboardPage, MySitesPage 공통)
// 썸네일 + 제목 + 상태 배지 + 편집/공유 버튼
import NeoButton from "./NeoButton";
import StatusBadge, { inferVariant } from "./StatusBadge";

interface SiteCardProps {
  id: string | number;
  title: string;
  pages: number;
  status: string;       // "공개" | "초안" | 등
  bg?: string;          // Tailwind 클래스 (e.g. "bg-mint")
  emoji?: string;
  thumbHeight?: number;
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
  bg = "bg-cream",
  emoji = "🎁",
  thumbHeight = 130,
  onEdit,
  onShare,
  onDelete,
}: SiteCardProps) {
  return (
    <div
      className={`neo-border overflow-hidden neo-card-lift ${bg}`}
      style={{ "--neo-shadow": "5px" } as React.CSSProperties}
    >
      {/* 썸네일 */}
      <div
        className="bg-black/10 flex items-center justify-center text-[44px]"
        style={{ height: thumbHeight }}
      >
        {emoji}
      </div>

      {/* 본문 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1.5 gap-2">
          <span className="font-headline text-[14px] leading-tight">{title}</span>
          <StatusBadge variant={inferVariant(status)}>{status}</StatusBadge>
        </div>

        <div className="font-body text-[11px] text-[#333] mb-3">{pages}페이지</div>

        <div className="flex gap-2 flex-wrap">
          <NeoButton
            size="sm"
            shadow={3}
            onClick={() => onEdit?.(id)}
          >
            편집
          </NeoButton>
          <NeoButton
            bg="var(--color-cream)"
            color="#111"
            size="sm"
            shadow={3}
            onClick={() => onShare?.(id)}
          >
            공유
          </NeoButton>
          {onDelete && (
            <NeoButton
              bg="var(--color-peach)"
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
