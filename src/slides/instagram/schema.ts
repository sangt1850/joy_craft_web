import type { SlideSchema } from "../SlideProps";

const DEFAULT_STORIES = JSON.stringify([
  { name: "내 스토리", caption: "오늘의 한 컷", images: [] },
  { name: "민지", caption: "주말 나들이!\n날씨가 너무 좋았어요", images: [] },
  { name: "준호", caption: "오랜만에 러닝\n5km 완주", images: [] },
  { name: "수빈", caption: "카페 발견\n여기 디저트 진짜 맛있다", images: [] },
  { name: "해나", caption: "작업실 정리 완료", images: [] },
  { name: "태윤", caption: "고양이는 오늘도 평화롭다", images: [] },
]);

const DEFAULT_POSTS = JSON.stringify([
  { user: "minji_kim", place: "성수동", caption: "주말 성수 나들이\n골목마다 예쁜 카페가 숨어 있어서 하루 종일 걸었어요.", images: [] },
  { user: "junho.log", place: "양양 해변", caption: "파도 소리 들으면서 아무 생각 없이 앉아 있던 시간", images: [] },
  { user: "subin_daily", place: "집", caption: "요즘 빠진 홈카페 세팅\n원두 바꿨더니 확실히 다르네요.", images: [] },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "appTitle", label: "앱 이름", type: "text", default: "Instagram" },
    {
      key: "stories",
      label: "스토리 목록",
      type: "array",
      itemLabel: "스토리",
      default: DEFAULT_STORIES,
      itemFields: [
        { key: "name", label: "이름", type: "text", default: "새 스토리", required: true },
        { key: "caption", label: "스토리 문구", type: "textarea", default: "" },
        {
          key: "images",
          label: "이미지",
          type: "imagelist",
          default: [],
          hint: "URL 입력 또는 파일 업로드 (여러 장 가능). 파일은 base64로 저장됩니다.",
        },
      ],
    },
    {
      key: "posts",
      label: "게시글 목록",
      type: "array",
      itemLabel: "게시글",
      default: DEFAULT_POSTS,
      itemFields: [
        { key: "user", label: "사용자 이름", type: "text", default: "user", required: true },
        { key: "place", label: "장소", type: "text", default: "" },
        { key: "caption", label: "게시글 내용", type: "textarea", default: "" },
        {
          key: "images",
          label: "이미지",
          type: "imagelist",
          default: [],
          hint: "URL 입력 또는 파일 업로드 (여러 장 가능). 파일은 base64로 저장됩니다.",
        },
      ],
    },
    { key: "accentColor", label: "포인트 색상", type: "color", default: "#E94F6A" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
