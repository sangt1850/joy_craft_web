import { registerSlide } from "../registry";
import Quiz from "./Quiz";

export { Quiz };
export { schema, defaultValues } from "./schema";

registerSlide("quiz", Quiz);
