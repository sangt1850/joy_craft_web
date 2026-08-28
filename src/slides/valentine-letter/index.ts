import { registerSlide } from "../registry";
import ValentineLetter from "./ValentineLetter";
import { schema } from "./schema";

export { ValentineLetter };
export { schema, defaultValues } from "./schema";

registerSlide("valentine-letter", ValentineLetter, schema);
