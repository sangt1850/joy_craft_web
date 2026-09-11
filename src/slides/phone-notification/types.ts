export type NotificationApp = "sms" | "instagram" | "kakao";
export type PhoneStyle = "iphone" | "samsung";

export interface PhoneNotificationItem {
  app: NotificationApp;
  sender: string;
  message: string;
  avatar?: string | null;
  /** 이전 알림 이후 대기 시간(초). 첫 항목은 화면 진입 기준. */
  delay: number;
}

export interface PhoneNotificationData {
  deviceStyle: PhoneStyle;
  wallpaper: string | null;
  backgroundColor: string;
  clockColor: string;
  notificationTheme: "light" | "dark";
  clockMode: "fixed" | "live";
  time: string;
  dateText: string;
  carrier: string;
  hint: string;
  enableVibration: boolean;
  notifications: string | PhoneNotificationItem[];
}

export const DEFAULT_NOTIFICATIONS: PhoneNotificationItem[] = [
  { app: "sms", sender: "지현", message: "오늘 무슨 날인지 기억해?", avatar: null, delay: 1.6 },
  { app: "instagram", sender: "ji.hyun", message: "너에게만 보여주고 싶은 이야기가 있어 ♡", avatar: null, delay: 2.4 },
  { app: "kakao", sender: "지현", message: "준비됐으면 이 알림을 눌러봐.\n작은 선물을 준비했어 ♡", avatar: null, delay: 2.4 },
];

export function parseNotifications(value: unknown): PhoneNotificationItem[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value); } catch { return DEFAULT_NOTIFICATIONS; }
  }
  if (!Array.isArray(parsed)) return DEFAULT_NOTIFICATIONS;
  return parsed.filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      app: item.app === "instagram" || item.app === "kakao" ? item.app : "sms",
      sender: typeof item.sender === "string" ? item.sender : "알림",
      message: typeof item.message === "string" ? item.message : "",
      avatar: typeof item.avatar === "string" ? item.avatar.trim() : null,
      delay: typeof item.delay === "number" && Number.isFinite(item.delay) ? Math.min(60, Math.max(0.2, item.delay)) : 2,
    }));
}
