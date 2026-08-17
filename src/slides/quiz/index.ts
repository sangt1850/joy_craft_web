import { registerSlide } from "../registry";
import Quiz from "./Quiz";
import { schema } from "./schema";

export { Quiz };
export { schema, defaultValues } from "./schema";

registerSlide("quiz", Quiz, schema);
