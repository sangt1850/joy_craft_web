import { registerSlide } from "../registry";
import HeartGauge from "./HeartGauge";
export { HeartGauge };
export { schema, defaultValues } from "./schema";
registerSlide("heart-gauge", HeartGauge);
