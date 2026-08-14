import type { SlideSchema } from "../SlideProps";

const DEFAULT_NOTES = JSON.stringify([
  { text: "늘 밝게 웃어줘서 고마워!\n올 한 해도 파이팅 💪", from: "지현", color: "#E94F6A" },
  { text: "너 덕분에 회사 다닐 맛 난다니까 ㅋㅋ", from: "민수", color: "#3a7ec0" },
  { text: "우리 우정 영원히 🫶\n조만간 또 보자!", from: "수빈", color: "#7EC8B1" },
  { text: "생일 진심으로 축하해!\n좋은 일만 가득하길 🎂", from: "준호", color: "#A78BCE" },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "title", label: "제목", type: "text", default: "우리들의 롤링페이퍼" },
    { key: "seedNotes", label: "초기 메모 (JSON)", type: "textarea", default: DEFAULT_NOTES },
    { key: "allowUserInput", label: "방문자 메모 작성 허용", type: "boolean", default: true },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#faf4ea" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
