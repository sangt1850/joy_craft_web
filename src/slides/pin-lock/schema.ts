import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "question", label: "질문 문구", type: "text", default: "우리가 처음 만난 날은?", required: true },
    { key: "answer", label: "정답 (4자리 숫자)", type: "text", default: "0214", required: true },
    { key: "hint", label: "힌트 문구", type: "text", default: "달력에 하트 그려둔 그날 💕" },
    { key: "hintAfter", label: "힌트 표시 (틀린 횟수)", type: "number", default: 3, min: 1, max: 10, step: 1 },
    { key: "successMessage", label: "성공 메시지", type: "text", default: "정답! 열어볼까?" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#1b1533" },
    { key: "accentColor", label: "강조 색상 (자물쇠)", type: "color", default: "#FFD97D" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
