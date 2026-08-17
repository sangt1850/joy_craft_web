import { registerSlide } from "../registry";
import Fingerprint from "./Fingerprint";
import { schema } from "./schema";

export { Fingerprint };
export { schema, defaultValues } from "./schema";

registerSlide("fingerprint", Fingerprint, schema);
