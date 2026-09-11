import { registerSlide } from "../registry";
import PhoneNotification from "./PhoneNotification";
import { schema } from "./schema";

export { PhoneNotification };
export { schema, defaultValues } from "./schema";
export type { PhoneNotificationData, PhoneNotificationItem, NotificationApp, PhoneStyle } from "./types";

registerSlide("phone-notification", PhoneNotification, schema);
