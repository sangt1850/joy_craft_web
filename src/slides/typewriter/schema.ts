import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "letterText", label: "편지 내용", type: "textarea", default: "보고 싶었어.\n\n오늘 하루는 어땠어?\n네 생각을 하다 보면\n하루가 금방 가더라.\n\n항상 응원할게.\n— 나로부터", required: true },
    { key: "typingSpeed", label: "타이핑 속도 (ms)", type: "number", default: 62, min: 20, max: 200, step: 10 },
    { key: "enableSound", label: "타이핑 사운드", type: "boolean", default: true },
    { key: "paperColor", label: "종이 색상", type: "color", default: "#f6f0e2" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#2b2620" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
