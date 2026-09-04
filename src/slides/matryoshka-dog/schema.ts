import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    {
      key: "message",
      label: "쪽지 메시지",
      type: "textarea",
      default: "생일 축하해!\n오래오래 건강하고 행복하자 🎂",
      required: true,
    },
    {
      key: "layerCount",
      label: "강아지 레이어 수",
      type: "number",
      default: 6,
      min: 2,
      max: 10,
      step: 1,
      hint: "2~10마리. 많을수록 오래 벗겨야 해요.",
    },
    {
      key: "backgroundColor",
      label: "배경 색상 (상단)",
      type: "color",
      default: "#FFF6F0",
    },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
