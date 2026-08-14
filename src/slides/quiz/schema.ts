import type { SlideSchema } from "../SlideProps";

const DEFAULT_QUESTIONS = JSON.stringify([
  { q: "내가 스트레스 받으면 제일 먼저 하는 건?", choices: ["매운 거 폭식 🌶️", "무작정 잠자기", "충동 쇼핑", "혼자 드라이브"], explain: "떡볶이 앞에서 스트레스는 못 참지." },
  { q: "우리 첫 데이트 장소, 어디였게?", choices: ["한강공원", "영화관", "놀이공원", "분위기 좋은 카페"], explain: "돗자리 깔고 치킨 먹었던 그날." },
  { q: "내가 세상에서 제일 무서워하는 건?", choices: ["벌레 🐛", "높은 곳", "귀신", "천둥번개"], explain: "바퀴벌레 보고 소리 질렀던 거 기억나?" },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "intro", label: "소개 문구", type: "text", default: "얼마나 알고 있나 볼까 😏" },
    { key: "highScoreMessage", label: "고득점 메시지", type: "text", default: "역시 나를 제일 잘 아는 사람 💯" },
    { key: "lowScoreMessage", label: "저득점 메시지", type: "text", default: "음... 우리 더 친해지자 😂" },
    { key: "questions", label: "퀴즈 목록 (JSON)", type: "textarea", default: DEFAULT_QUESTIONS },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#FFF8F0" },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#E94F6A" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
