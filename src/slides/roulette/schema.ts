import type { SlideSchema } from "../SlideProps";

const DEFAULT_SLICES = JSON.stringify([
  { label: "영화 한 편", detail: "보고 싶던 그 영화, 오늘 봐요 🍿", weight: 1, color: "#E94F6A" },
  { label: "맛집 탐방", detail: "저장해둔 맛집 리스트 오픈 🍜", weight: 2, color: "#FFD97D" },
  { label: "드라이브", detail: "노을 지는 길 따라 달려요 🚗", weight: 1, color: "#7EC8B1" },
  { label: "카페 수다", detail: "디저트 시켜놓고 수다 삼매경 ☕", weight: 1, color: "#F4A7C0" },
  { label: "노래방", detail: "18번 곡부터 예약 완료 🎤", weight: 1, color: "#A78BCE" },
  { label: "집콕 넷플릭스", detail: "이불 속에서 뒹굴뒹굴 🛋️", weight: 2, color: "#FFB26B" },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "title", label: "제목", type: "textarea", default: "오늘 뭐 할지\n룰렛이 정해줄게" },
    {
      key: "slices",
      label: "룰렛 항목",
      type: "array",
      itemLabel: "칸",
      default: DEFAULT_SLICES,
      itemFields: [
        { key: "label", label: "이름", type: "text", default: "새 항목", required: true },
        { key: "detail", label: "당첨 시 문구", type: "textarea", default: "" },
        {
          key: "weight",
          label: "가중치",
          type: "number",
          default: 1,
          min: 1,
          max: 9,
          step: 1,
          hint: "클수록 잘 뽑힙니다",
        },
        { key: "color", label: "칸 색상", type: "color", default: "#E94F6A" },
      ],
    },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#fff5f7" },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#E94F6A" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
