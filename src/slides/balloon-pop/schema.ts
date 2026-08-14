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
    { key: "balloons", label: "풍선 목록 (JSON)", type: "textarea", default: DEFAULT_BALLOONS },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#eaf6ff" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
