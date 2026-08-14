import { registerSlide } from "../registry";
import Fingerprint from "./Fingerprint";

export { Fingerprint };
export { schema, defaultValues } from "./schema";

registerSlide("fingerprint", Fingerprint);
