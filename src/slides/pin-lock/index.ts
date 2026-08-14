import { registerSlide } from "../registry";
import PinLock from "./PinLock";

export { PinLock };
export { schema, defaultValues } from "./schema";

registerSlide("pin-lock", PinLock);
