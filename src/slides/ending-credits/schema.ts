import type { SlideSchema } from "../SlideProps";

const DEFAULT_CREDITS = JSON.stringify([
  { role: "주연", name: "너 그리고 나" },
  { role: "감독", name: "운명" },
  { role: "각본", name: "매일의 대화" },
  { role: "촬영", name: "수많은 셀카" },
  { role: "음악", name: "함께 듣던 플레이리스트" },
  { role: "미술", name: "데이트 코스" },
  { role: "특별출연", name: "우리를 응원한 친구들" },
  { role: "제작", name: "2024–2025" },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "movieTitle", label: "영화 제목", type: "text", default: "우리들의 1년" },
    { key: "endMessage", label: "마지막 메시지", type: "textarea", default: "THE END\n고마웠어 ♥" },
    { key: "credits", label: "크레딧 목록 (JSON)", type: "textarea", default: DEFAULT_CREDITS },
    { key: "enableSound", label: "배경음 재생", type: "boolean", default: true },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
