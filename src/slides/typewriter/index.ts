import { registerSlide } from "../registry";
import Typewriter from "./Typewriter";
import { schema } from "./schema";

export { Typewriter };
export { schema, defaultValues } from "./schema";

registerSlide("typewriter", Typewriter, schema);
