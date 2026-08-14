import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "prompt", label: "안내 문구", type: "textarea", default: "손가락을 올려서\n인증해주세요" },
    { key: "successMessage", label: "인증 완료 메시지", type: "textarea", default: "본인 확인 완료.\n당신에게만 열리는 페이지예요." },
    { key: "holdDuration", label: "인증 시간 (초)", type: "number", default: 2.5, min: 1, max: 5, step: 0.5 },
    { key: "ringColor", label: "게이지 색상", type: "color", default: "#4dd0ff" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
