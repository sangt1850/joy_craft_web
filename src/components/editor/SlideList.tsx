// 좌측 페이지 목록 — 선택 / 드래그 정렬 / 삭제.
//
// @dnd-kit이 설치만 되어 있고 한 번도 쓰이지 않았기에 여기서 처음 사용한다.
// PointerSensor에 distance 제약을 둬서 "클릭 = 선택", "끌기 = 정렬"이 겹치지 않게 한다.
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SlideResponse } from "../../types/api";
import { cn } from "../../utils/cn";

const PAGE_COLORS = ["bg-pink", "bg-mustard", "bg-mint", "bg-blue"];

interface SlideListProps {
  slides: SlideResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (slideIds: string[]) => void;
  onRemove: (id: string) => void;
}

export default function SlideList({
  slides,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
}: SlideListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ids = slides.map((s) => s.id);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  if (slides.length === 0) {
    return (
      <p className="font-body text-[11px] text-black/50 leading-relaxed px-1 py-3">
        아직 페이지가 없습니다.
        <br />
        아래에서 추가해 주세요.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {slides.map((slide, idx) => (
          <SortableSlideRow
            key={slide.id}
            slide={slide}
            index={idx}
            selected={selectedId === slide.id}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
interface SortableSlideRowProps {
  slide: SlideResponse;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function SortableSlideRow({ slide, index, selected, onSelect, onRemove }: SortableSlideRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  return (
    <div
      ref={setNodeRef}
      // transform/transition은 dnd-kit이 계산하는 동적 값 — 인라인 style이 유일한 경로다
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 px-2 py-[9px] mb-1 rounded-md border-2 group",
        isDragging ? "opacity-60 z-10 relative" : "",
        selected ? "bg-ink border-ink" : "bg-transparent border-transparent hover:bg-black/5"
      )}
    >
      {/* 드래그 + 선택 영역 */}
      <button
        type="button"
        onClick={() => onSelect(slide.id)}
        {...attributes}
        {...listeners}
        aria-label={`${index + 1}번 페이지 ${slide.templateName}`}
        className="flex items-center gap-2.5 flex-1 min-w-0 bg-transparent border-none p-0 cursor-grab text-left touch-none"
      >
        <span
          className={cn(
            "w-[22px] h-[22px] neo-border flex items-center justify-center shrink-0 font-pixel text-[8px] text-ink",
            PAGE_COLORS[index % PAGE_COLORS.length]
          )}
        >
          {index + 1}
        </span>
        <span
          className={cn(
            "font-sub text-[13px] truncate",
            selected ? "text-cream" : "text-ink"
          )}
        >
          {slide.templateName}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onRemove(slide.id)}
        aria-label={`${slide.templateName} 삭제`}
        title="이 페이지 삭제"
        className={cn(
          "shrink-0 bg-transparent border-none cursor-pointer p-1 leading-none opacity-0 group-hover:opacity-100 focus:opacity-100",
          selected ? "opacity-70" : ""
        )}
      >
        <span className={cn("font-pixel text-[11px]", selected ? "text-cream" : "text-ink")}>
          ✕
        </span>
      </button>
    </div>
  );
}
