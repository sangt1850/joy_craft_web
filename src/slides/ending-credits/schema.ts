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
    { key: "subtitle", label: "부제 (상단 작은 글씨)", type: "text", default: "", placeholder: "A STORY BY US" },
    { key: "endMessage", label: "마지막 메시지", type: "textarea", default: "THE END\n고마웠어 ♥" },
    {
      key: "credits",
      label: "크레딧 목록",
      type: "array",
      itemLabel: "크레딧",
      default: DEFAULT_CREDITS,
      itemFields: [
        { key: "section", label: "섹션 제목 (선택)", type: "text", default: "" },
        { key: "role", label: "역할", type: "text", default: "역할" },
        { key: "name", label: "이름", type: "text", default: "이름", required: true },
      ],
    },
    { key: "enableSound", label: "소리 켜기 (시작 시)", type: "boolean", default: false },
    {
      key: "mode",
      label: "표시 방식",
      type: "select",
      default: "text",
      options: [
        { label: "텍스트 크레딧", value: "text" },
        { label: "영상 + 크레딧", value: "video" },
      ],
    },
    { key: "videoUrl", label: "사진 또는 영상 URL (영상 모드)", type: "text", default: "", hint: "YouTube 링크 · MP4/WebM 파일 URL · JPG/PNG/WebP 이미지 URL" },
    { key: "speed", label: "스크롤 속도 (px/초)", type: "number", default: 28, min: 10, max: 80, step: 1 },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
