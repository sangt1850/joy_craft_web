import { registerSlide } from "../registry";
import {GiftUnboxing} from "./GiftUnboxing";
import { schema } from "./schema";

export { GiftUnboxing };
export { schema, defaultValues } from "./schema";

registerSlide("gift-unboxing", GiftUnboxing, schema);
