import type { SlideSchema } from "../SlideProps";

const DEFAULT_TRACKS = JSON.stringify([
  {
    youtubeUrl: "https://www.youtube.com/watch?v=oo7Qq3qOCyw",
    title: "🎹 아무 생각 없이 듣는 편안한 뉴에이지 피아노 | Relaxing Piano",
  },
]);

export const schema: SlideSchema = {
  fields: [
    {
      key: "tracks",
      label: "재생목록",
      type: "array",
      itemLabel: "트랙",
      default: DEFAULT_TRACKS,
      itemFields: [
        {
          key: "youtubeUrl",
          label: "YouTube URL",
          type: "text",
          default: "",
          placeholder: "https://www.youtube.com/watch?v=...",
          hint: "링크를 붙여넣으면 앨범 아트가 자동으로 설정돼요. YouTube Premium 미가입 시 광고가 재생될 수 있어요.",
        },
        {
          key: "title",
          label: "곡 제목",
          type: "text",
          default: "Our Song",
          hint: "재생 시 YouTube 영상 제목으로 자동 대체돼요.",
          required: true,
        },
      ],
    },
    {
      key: "textColor",
      label: "글자 색상",
      type: "color",
      default: "#ffffff",
    },
    {
      key: "backgroundColor",
      label: "배경 색상",
      type: "color",
      default: "#0d1117",
    },
    {
      key: "spinSpeed",
      label: "LP 회전 속도 (초/바퀴)",
      type: "number",
      default: 12,
      min: 3,
      max: 60,
      step: 1,
      hint: "숫자가 작을수록 빠르게 돌아요.",
    },
    {
      key: "scrollSpeed",
      label: "제목 스크롤 속도 (초/순환)",
      type: "number",
      default: 18,
      min: 4,
      max: 60,
      step: 1,
      hint: "숫자가 작을수록 빠르게 움직여요.",
    },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
