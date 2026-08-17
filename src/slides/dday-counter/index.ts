import { registerSlide } from "../registry";
import DdayCounter from "./DdayCounter";
import { schema } from "./schema";

export { DdayCounter };
export { schema, defaultValues } from "./schema";

registerSlide("dday-counter", DdayCounter, schema);
