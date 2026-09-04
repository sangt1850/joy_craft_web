import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "insideMessage", label: "상자 안 메시지", type: "textarea", default: "짜잔! 열어줘서 고마워 🎁", required: true },
    { key: "insideImage", label: "상자 안 이미지", type: "image", default: null },
    { key: "hint", label: "안내 문구", type: "text", default: "리본을 아래로 당겨보세요" },
    { key: "boxColor", label: "상자 색상", type: "color", default: "#E94F6A" },
    { key: "ribbonColor", label: "리본 색상", type: "color", default: "#FFD97D" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#fff0f3" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
