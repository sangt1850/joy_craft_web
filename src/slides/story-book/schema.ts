import type { SlideSchema } from "../SlideProps";

const DEFAULT_PAGES = JSON.stringify([
  { emoji: "🌱", title: "봄, 우리 시작", text: "벚꽃이 흩날리던 날\n우리는 처음 만났지.", bgColor: "#fdf6e8" },
  { emoji: "☀️", title: "여름, 뜨겁게", text: "바다로 떠난 첫 여행,\n웃음이 끊이지 않았어.", bgColor: "#fdf1e8" },
  { emoji: "🍂", title: "가을, 깊어져", text: "낙엽길을 걸으며\n서로를 더 알게 됐어.", bgColor: "#faf0e0" },
  { emoji: "❄️", title: "겨울, 따뜻하게", text: "눈 오는 밤\n같은 담요 안에서.", bgColor: "#f0f4f8" },
  { emoji: "💍", title: "그리고, 계속", text: "앞으로의 모든 계절도\n너와 함께.", bgColor: "#fdeef2" },
]);

export const schema: SlideSchema = {
  fields: [
    {
      key: "pages",
      label: "페이지 목록",
      type: "array",
      itemLabel: "페이지",
      default: DEFAULT_PAGES,
      itemFields: [
        { key: "emoji", label: "이모지", type: "text", default: "✨" },
        { key: "title", label: "소제목", type: "text", default: "새 페이지", required: true },
        { key: "text", label: "내용", type: "textarea", default: "" },
        { key: "bgColor", label: "배경 색상", type: "color", default: "#fdf6e8" },
      ],
    },
    { key: "footerText", label: "안내 문구", type: "text", default: "← 좌우로 넘겨보세요 →" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#efe6d6" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
