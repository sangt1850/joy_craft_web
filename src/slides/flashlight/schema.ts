import type { SlideSchema } from "../SlideProps";

const DEFAULT_SPOTS = JSON.stringify([
  { x: 0.24, y: 0.24, emoji: "📷", caption: "첫 여행" },
  { x: 0.74, y: 0.42, emoji: "🎂", caption: "생일날" },
  { x: 0.44, y: 0.78, emoji: "💌", caption: "그 편지" },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "instruction", label: "안내 문구", type: "text", default: "화면을 비춰서 찾아보세요" },
    { key: "clearText", label: "클리어 메시지", type: "textarea", default: "우리 추억,\n다 찾았네 ✨" },
    {
      key: "spots",
      label: "숨겨진 아이템",
      type: "array",
      itemLabel: "아이템",
      default: DEFAULT_SPOTS,
      itemFields: [
        { key: "emoji", label: "이모지", type: "text", default: "✨" },
        { key: "caption", label: "설명", type: "text", default: "새 추억", required: true },
        {
          key: "x",
          label: "가로 위치",
          type: "number",
          default: 0.5,
          min: 0.05,
          max: 0.95,
          step: 0.01,
          hint: "0 = 왼쪽 끝, 1 = 오른쪽 끝",
        },
        { key: "y", label: "세로 위치", type: "number", default: 0.5, min: 0.05, max: 0.95, step: 0.01 },
      ],
    },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#0d1117" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
