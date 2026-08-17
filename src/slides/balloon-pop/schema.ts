import type { SlideSchema } from "../SlideProps";

const DEFAULT_BALLOONS = JSON.stringify([
  { x: 12, y: 8, color: "#E94F6A", emoji: "🎂" },
  { x: 58, y: 4, color: "#FFD97D", emoji: "🎈" },
  { x: 34, y: 30, color: "#7EC8B1", emoji: "🎁" },
  { x: 70, y: 34, color: "#A78BCE", emoji: "✨" },
  { x: 10, y: 54, color: "#F4A7C0", emoji: "💝" },
  { x: 54, y: 60, color: "#FFB26B", emoji: "🎉" },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "successMessage", label: "성공 메시지", type: "textarea", default: "펑펑!\n생일 축하해 🎂" },
    {
      key: "balloons",
      label: "풍선 목록",
      type: "array",
      itemLabel: "풍선",
      default: DEFAULT_BALLOONS,
      itemFields: [
        { key: "emoji", label: "이모지", type: "text", default: "🎈" },
        { key: "color", label: "풍선 색상", type: "color", default: "#E94F6A" },
        { key: "x", label: "가로 위치 (%)", type: "number", default: 30, min: 0, max: 75, step: 1 },
        { key: "y", label: "세로 위치 (%)", type: "number", default: 30, min: 0, max: 70, step: 1 },
      ],
    },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#eaf6ff" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
