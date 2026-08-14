import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "letterBody", label: "편지 내용", type: "textarea", default: "늘 곁에 있어줘서\n고마워.\n오늘도 사랑해 💌", required: true },
    { key: "hint", label: "안내 문구", type: "text", default: "봉투를 탭해서 편지를 열어보세요" },
    { key: "envelopeColor", label: "봉투 색상", type: "color", default: "#e8c98a" },
    { key: "sealColor", label: "봉랍 색상", type: "color", default: "#E94F6A" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#f4ede0" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
