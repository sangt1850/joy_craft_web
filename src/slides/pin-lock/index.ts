import { registerSlide } from "../registry";
import PinLock from "./PinLock";
import { schema } from "./schema";

export { PinLock };
export { schema, defaultValues } from "./schema";

registerSlide("pin-lock", PinLock, schema);
