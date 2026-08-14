import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "eventName", label: "이벤트 이름", type: "text", default: "크리스마스" },
    { key: "targetDate", label: "목표 날짜 (YYYY-MM-DD)", type: "text", default: "2026-12-25" },
    { key: "message", label: "하단 메시지", type: "textarea", default: "조금만 더 기다리면\n만날 수 있어 💫" },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#FFD97D" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#1e1b3a" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
