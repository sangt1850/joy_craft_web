import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    // -- 이동 수단 --
    { key: "travelMode", label: "이동 수단", type: "select", widget: "segment", default: "flight",
      options: [
        { label: "항공", value: "flight", icon: "✈️" },
        { label: "자동차", value: "car",  icon: "🚗" },
        { label: "기차",  value: "train", icon: "🚆" },
      ],
    },
    // -- 출발/도착지 --
    { key: "fromCode", label: "출발지 코드", type: "text", default: "ICN" },
    { key: "fromName", label: "출발지 이름", type: "text", default: "서울 \u00b7 인천국제공항" },
    { key: "toCode", label: "도착지 코드", type: "text", default: "NRT" },
    { key: "toName", label: "도착지 이름", type: "text", default: "도쿄 \u00b7 나리타국제공항" },
    // -- 편명 및 일정 --
    { key: "flightNo", label: "편명 / 차량번호 / 열차번호", type: "text", default: "OZ 502", hint: "항공: 'OZ 502' · 자동차: '12가 3456' · 기차: 'KTX 101'" },
    { key: "boardingDate", label: "날짜", type: "text", default: "2026. 10. 17" },
    { key: "gate", label: "경유", type: "text", default: "34", hint: "항공: 게이트 번호 · 자동차: 경유 고속도로 · 기차: 플랫폼 번호" },
    { key: "terminal", label: "터미널 / 호차", type: "text", default: "1", hint: "항공: 터미널 번호 · 자동차: 주차 구역 · 기차: 호차 번호" },
    { key: "boardingTime", label: "출발", type: "text", default: "SAT \u00b7 09:20 AM" },
    { key: "arrivalTime", label: "도착", type: "text", default: "SAT \u00b7 11:30 AM" },
    // -- 좌석 및 기타 --
    { key: "flightClass", label: "클래스", type: "text", default: "ECONOMY" },
    { key: "seatNo", label: "좌석", type: "text", default: "12A-D" },
    { key: "baggageNote", label: "안내", type: "text", default: "수하물은 1인당 20kg까지" },
    // -- 탑승자 --
    { key: "passengerName", label: "탑승자", type: "textlist", default: ["HONG GILDONG"], hint: "한 줄에 한 명씩 입력하세요" },
    // -- 티켓 제목 --
    { key: "tripTitle", label: "티켓 제목", type: "text", default: "Travel Pass 2026" },
    // -- 뒷면 --
    { key: "backTitle", label: "뒷면 제목", type: "textarea", default: "Seoul\n& Tokyo" },
    { key: "backDescription", label: "뒷면 설명", type: "textarea", default: "인천에서 나리타까지, 3박 4일의 여정. 좋은 추억만 담아오기로 해요." },
    { key: "contactLabel", label: "연락처 라벨", type: "text", default: "담당 \u00b7 여행사" },
    { key: "contactPhone", label: "연락처", type: "text", default: "010-0000-0000" },
    { key: "accommodationLabel", label: "숙소 라벨", type: "text", default: "숙소 \u00b7 신주쿠 게스트하우스" },
    { key: "accommodationDuration", label: "숙박 기간", type: "text", default: "3박 4일" },
    { key: "returnDate", label: "귀국 날짜", type: "text", default: "2026.10.20 TUE" },
    { key: "returnRoute", label: "귀국 노선", type: "text", default: "NRT \u2192 ICN" },
    // -- 여권 & 색상 --
    { key: "passportImage", label: "여권 표지 이미지", type: "image", default: null },
    { key: "accentColor", label: "강조 색상", type: "color", default: "#4d63f5" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#0b1a3a" },
    { key: "animationSpeed", label: "애니메이션 속도", type: "number", default: 1, min: 0.4, max: 2, step: 0.1 },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
