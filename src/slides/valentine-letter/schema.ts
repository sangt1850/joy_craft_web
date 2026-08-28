import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "envelopeHint", label: "봉투 힌트 문구", type: "text", default: "♡ Letter for You ♡" },
    { key: "letterTitle", label: "편지 제목", type: "text", default: "Will you be my Valentine?" },
    { key: "yesTitle", label: "YES 후 제목", type: "text", default: "Yippeeee!" },
    { key: "finalText", label: "최종 메시지", type: "textarea", default: "Valentine Date: Meow Restaurant at 7pm. Dress fancy!" },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#c0006a" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
