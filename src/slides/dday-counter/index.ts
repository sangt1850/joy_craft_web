import { registerSlide } from "../registry";
import DdayCounter from "./DdayCounter";
export { DdayCounter };
export { schema, defaultValues } from "./schema";
registerSlide("dday-counter", DdayCounter);
