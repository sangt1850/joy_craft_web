import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "title", label: "제목", type: "text", default: "마음 게이지" },
    { key: "targetCount", label: "목표 탭 횟수", type: "number", default: 30, min: 10, max: 100, step: 5 },
    { key: "successMessage", label: "성공 메시지", type: "textarea", default: "마음이\n가득 찼어요 💗" },
    { key: "heartColor", label: "하트 색상", type: "color", default: "#E94F6A" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#fff0f4" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
