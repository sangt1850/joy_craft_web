import type { SlideSchema } from "../SlideProps";
import { DEFAULT_NOTIFICATIONS } from "./types";

export const schema: SlideSchema = {
  fields: [
    { key: "deviceStyle", label: "스마트폰 스타일", type: "select", default: "iphone", options: [{ label: "아이폰", value: "iphone" }, { label: "삼성", value: "samsung" }] },
    { key: "wallpaper", label: "잠금화면 배경 이미지", type: "image", default: null, hint: "비워두면 기기 스타일에 맞는 기본 배경을 사용합니다." },
    { key: "backgroundColor", label: "PC 바깥 배경", type: "color", default: "#eeedf2" },
    { key: "clockColor", label: "시계·상태 표시 색상", type: "color", default: "#29263d" },
    { key: "notificationTheme", label: "알림 카드 색상", type: "select", default: "light", options: [{ label: "밝게", value: "light" }, { label: "어둡게", value: "dark" }] },
    { key: "clockMode", label: "시간 표시 방식", type: "select", default: "fixed", options: [{ label: "직접 설정", value: "fixed" }, { label: "현재 시간", value: "live" }] },
    { key: "time", label: "표시 시간", type: "text", default: "9:41", hint: "직접 설정 모드에서 사용합니다. 예: 9:41, 21:30" },
    { key: "dateText", label: "표시 날짜", type: "text", default: "9월 11일 금요일", hint: "현재 시간 모드에서는 보는 사람의 현지 날짜가 표시됩니다." },
    { key: "carrier", label: "통신사 이름", type: "text", default: "JoyCraft" },
    { key: "hint", label: "하단 안내 문구", type: "text", default: "알림을 눌러 이야기를 이어가세요" },
    { key: "enableVibration", label: "알림 도착 시 진동", type: "boolean", default: false, hint: "지원 기기에서만 작동하며, 브라우저에 따라 첫 터치 전에는 진동이 제한됩니다." },
    {
      key: "notifications", label: "알림 목록", type: "array", itemLabel: "알림",
      default: JSON.stringify(DEFAULT_NOTIFICATIONS),
      hint: "목록 순서대로 도착합니다. 도착한 알림 중 하나를 누르면 다음 슬라이드로 이동합니다.",
      itemFields: [
        { key: "app", label: "알림 종류", type: "select", default: "sms", options: [{ label: "문자", value: "sms" }, { label: "Instagram DM", value: "instagram" }, { label: "카카오톡", value: "kakao" }] },
        { key: "sender", label: "보낸 사람", type: "text", default: "지현", required: true },
        { key: "message", label: "알림 내용", type: "textarea", default: "너에게 전하고 싶은 이야기가 있어 ♡", required: true },
        { key: "avatar", label: "프로필 이미지", type: "image", default: null },
        { key: "delay", label: "도착 간격 (초)", type: "number", default: 2, min: 0.2, max: 60, step: 0.2, hint: "첫 알림은 화면 진입 후, 이후 알림은 직전 알림 도착 후의 시간입니다." },
      ],
    },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(schema.fields.map((field) => [field.key, field.default]));
