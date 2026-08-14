import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "prompt", label: "안내 문구", type: "text", default: "소원을 적고 하늘로 띄워보내요" },
    { key: "doneMessage", label: "완료 메시지", type: "textarea", default: "소원이\n하늘로 올라갔어요 🌟" },
    { key: "lanternColor", label: "등불 색상", type: "color", default: "#ffb463" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#0a0f26" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
