import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "question", label: "질문", type: "textarea", default: "오늘 점심\n같이 먹을래?", required: true },
    { key: "yesLabel", label: "YES 버튼 텍스트", type: "text", default: "예" },
    { key: "noLabel", label: "NO 버튼 텍스트", type: "text", default: "아니오" },
    { key: "successTitle", label: "성공 제목", type: "text", default: "좋아요!" },
    { key: "successBody", label: "성공 메시지", type: "textarea", default: "그럼 12시에 1층 로비에서 만나요.\n메뉴는 가서 정하기로 해요." },
    { key: "accentColor", label: "YES 버튼 색상", type: "color", default: "#2C3E50" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#eef1f5" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
