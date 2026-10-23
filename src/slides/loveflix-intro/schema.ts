import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "brandText", label: "브랜드 문구", type: "text", default: "LOVEFLIX", required: true },
    { key: "profileTitle", label: "프로필 선택 문구", type: "text", default: "LOVEFLIX를 시청할 프로필을 선택하세요." },
    { key: "addProfileText", label: "프로필 추가 문구", type: "text", default: "프로필 추가" },
    { key: "manageProfileText", label: "프로필 관리 문구", type: "text", default: "프로필 관리" },
    {
      key: "profiles",
      label: "프로필 목록",
      type: "array",
      itemLabel: "프로필",
      default: JSON.stringify([
        { name: "우리", image: "" },
        { name: "데이트", image: "" },
        { name: "일상", image: "" },
      ]),
      itemFields: [
        { key: "name", label: "프로필 이름", type: "text", default: "새 프로필", required: true },
        { key: "image", label: "프로필 사진", type: "image", default: "" },
      ],
    },

    { key: "heroImage", label: "메인 배경 사진", type: "image", default: "" },
    { key: "heroEyebrow", label: "작품 분류", type: "text", default: "N  영화" },
    { key: "heroTitle", label: "메인 제목", type: "text", default: "우리 결혼해요! ♡", required: true },
    { key: "heroBadgeText", label: "TOP 10 문구", type: "text", default: "오늘 가장 빛나는 커플 1위" },
    {
      key: "heroDescription",
      label: "메인 설명",
      type: "textarea",
      default: "우리의 장면들을 한 편의 작품처럼. 가장 빛나는 순간들을 모아 만든 특별한 이야기입니다.",
    },
    { key: "playText", label: "재생 버튼 문구", type: "text", default: "재생" },
    { key: "detailText", label: "상세 버튼 문구", type: "text", default: "상세 정보" },
    { key: "rankingTitle", label: "랭킹 영역 제목", type: "text", default: "우리의 결혼 여행기 TOP 10 시리즈" },
    {
      key: "rankingItems",
      label: "랭킹 사진 목록",
      type: "array",
      itemLabel: "랭킹 카드",
      default: JSON.stringify([
        { title: "첫 번째 추억", image: "" },
        { title: "두 번째 추억", image: "" },
        { title: "세 번째 추억", image: "" },
        { title: "네 번째 추억", image: "" },
      ]),
      itemFields: [
        { key: "title", label: "카드 제목", type: "text", default: "새 추억" },
        { key: "image", label: "카드 사진", type: "image", default: "" },
      ],
    },

    { key: "detailImage", label: "상세 화면 사진", type: "image", default: "" },
    { key: "detailTitle", label: "상세 화면 제목", type: "text", default: "우리 결혼해요! ♡" },
    { key: "detailBadgeText", label: "상세 강조 문구", type: "text", default: "오늘 가장 빛나는 커플 1위" },
    {
      key: "detailDescription",
      label: "상세 설명",
      type: "textarea",
      default: "둘이 함께한 시간과 앞으로 함께할 순간을 한 편의 영화처럼 담았습니다.",
    },
    { key: "detailMetaLeft", label: "상세 정보 1", type: "text", default: "출연: 우리 둘" },
    { key: "detailMetaRight", label: "상세 정보 2", type: "text", default: "장르: 로맨스, 추억, 결혼" },

    { key: "accentColor", label: "브랜드 포인트 색상", type: "color", default: "#E50914" },
    { key: "introDuration", label: "인트로 지속시간(ms)", type: "number", default: 2200, min: 900, max: 6000, step: 100 },
    { key: "autoOpenProfile", label: "인트로 후 프로필 선택 표시", type: "boolean", default: true },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((field) => [field.key, field.default])
);
