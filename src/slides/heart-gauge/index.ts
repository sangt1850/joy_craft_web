import { registerSlide } from "../registry";
import HeartGauge from "./HeartGauge";
import { schema } from "./schema";

export { HeartGauge };
export { schema, defaultValues } from "./schema";

registerSlide("heart-gauge", HeartGauge, schema);
