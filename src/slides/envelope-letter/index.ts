import { registerSlide } from "../registry";
import EnvelopeLetter from "./EnvelopeLetter";
import { schema } from "./schema";

export { EnvelopeLetter };
export { schema, defaultValues } from "./schema";

registerSlide("envelope-letter", EnvelopeLetter, schema);
