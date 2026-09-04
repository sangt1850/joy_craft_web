import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    {
      key: "boxColor",
      label: "상자 색상",
      type: "color",
      default: "#FD5D71",
    },
    {
      key: "ribbonColor",
      label: "끈/리본 색상",
      type: "color",
      default: "#FFE7F2",
    },
    {
      key: "cardImage",
      label: "카드 이미지 (URL)",
      type: "image",
      default: null,
    },
    {
      key: "cardEmoji",
      label: "카드 이모지",
      type: "text",
      default: "🎁",
    },
    {
      key: "cardTitle",
      label: "카드 제목",
      type: "text",
      default: "생일 축하해!",
      required: true,
    },
    {
      key: "cardMessage",
      label: "카드 메시지",
      type: "textarea",
      default: "늘 곁에 있어줘서 고마워.\n오늘 하루도 반짝이길 바라.",
      required: true,
    },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
