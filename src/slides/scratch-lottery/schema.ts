import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "prizeEmoji", label: "당첨 이모지", type: "text", default: "🎉" },
    { key: "prizeText", label: "당첨 메시지", type: "textarea", default: "당첨!\n오늘 저녁은 내가 쏜다", required: true },
    { key: "prompt", label: "안내 문구", type: "text", default: "은박을 긁어서 확인해 보세요" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#2b2340" },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#c7b8e0" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
