// 우측 편집 패널 본문 — 스키마를 순회해 위젯을 자동 생성한다.
// 하드코딩된 필드는 하나도 없다. 필드 목록의 출처는 schemaAdapter.resolveEditorSchema.
import type { ResolvedEditorSchema } from "../../slides/schemaAdapter";
import FieldWidget from "./fields/FieldWidget";
import ArrayFieldEditor from "./fields/ArrayFieldEditor";
import NeoCard from "../ui/NeoCard";

interface SlideFieldsPanelProps {
  schema: ResolvedEditorSchema;
  /** defaultValues + overrides가 병합된 현재 값 */
  values: Record<string, unknown>;
  /** 이 슬라이드 템플릿의 정본 기본값 — "기본값으로 되돌리기"가 쓴다 */
  defaultValues?: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export default function SlideFieldsPanel({
  schema,
  values,
  defaultValues,
  onChange,
}: SlideFieldsPanelProps) {
  if (schema.fields.length === 0) {
    return (
      <NeoCard bg="var(--color-surface)" pad={14} shadow={3} border={2}>
        <p className="font-body text-[12px] leading-relaxed">
          이 슬라이드의 편집 항목을 찾지 못했습니다. 템플릿 정보가 오래되었을 수 있어요.
        </p>
      </NeoCard>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {schema.source === "server" && (
        <NeoCard bg="var(--color-secondary)" pad={10} shadow={3} border={2}>
          <p className="font-body text-[11px] leading-snug">
            서버 스키마로 편집 중입니다. 일부 항목은 단순 입력으로만 보일 수 있어요.
          </p>
        </NeoCard>
      )}

      {schema.fields.map((field) =>
        field.type === "array" ? (
          <ArrayFieldEditor
            key={field.key}
            field={field}
            value={values[field.key]}
            resetValue={defaultValues?.[field.key]}
            onChange={(v) => onChange(field.key, v)}
          />
        ) : (
          <FieldWidget
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => onChange(field.key, v)}
          />
        )
      )}
    </div>
  );
}
