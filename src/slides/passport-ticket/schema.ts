import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    // -- 앞면: 탑승 정보 --
    { key: "passengerName", label: "탑승자 이름", type: "text", default: "HONG GILDONG" },
    { key: "flightNo", label: "항공편", type: "text", default: "OZ 502" },
    { key: "seatNo", label: "좌석", type: "text", default: "12A-D" },
    { key: "gate", label: "게이트", type: "text", default: "34" },
    { key: "terminal", label: "터미널", type: "text", default: "1" },
    { key: "fromCode", label: "출발 공항 코드", type: "text", default: "ICN" },
    { key: "fromName", label: "출발 공항 이름", type: "text", default: "서울 \u00b7 인천국제공항" },
    { key: "toCode", label: "도착 공항 코드", type: "text", default: "NRT" },
    { key: "toName", label: "도착 공항 이름", type: "text", default: "도쿄 \u00b7 나리타국제공항" },
    { key: "boardingDate", label: "탑승 날짜", type: "text", default: "2026. 10. 17" },
    { key: "boardingTime", label: "탑승 시간", type: "text", default: "SAT \u00b7 09:20 AM 탑승" },
    { key: "tripTitle", label: "티켓 제목", type: "text", default: "Travel Pass 2026" },
    { key: "flightClass", label: "좌석 등급", type: "text", default: "ECONOMY" },
    { key: "baggageNote", label: "수하물 안내", type: "text", default: "수하물은 1인당 20kg까지" },
    // -- 뒷면 --
    { key: "backTitle", label: "뒷면 제목", type: "textarea", default: "Seoul\n& Tokyo" },
    { key: "backDescription", label: "뒷면 설명", type: "textarea", default: "인천에서 나리타까지, 3박 4일의 여정. 좋은 추억만 담아오기로 해요." },
    { key: "contactLabel", label: "연락처 라벨", type: "text", default: "담당 \u00b7 여행사" },
    { key: "contactPhone", label: "연락처", type: "text", default: "010-0000-0000" },
    { key: "accommodationLabel", label: "숙소 라벨", type: "text", default: "숙소 \u00b7 신주쿠 게스트하우스" },
    { key: "accommodationDuration", label: "숙박 기간", type: "text", default: "3박 4일" },
    { key: "returnDate", label: "귀국 날짜", type: "text", default: "2026.10.20 TUE" },
    { key: "returnRoute", label: "귀국 노선", type: "text", default: "NRT \u2192 ICN" },
    // -- 여권/색상 --
    { key: "passportImage", label: "여권 표지 이미지", type: "image", default: null },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#4d63f5" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#0b1a3a" },
    { key: "animationSpeed", label: "애니메이션 속도", type: "number", default: 1, min: 0.4, max: 2, step: 0.1 },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
