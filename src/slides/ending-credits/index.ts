import { registerSlide } from "../registry";
import EndingCredits from "./EndingCredits";
import { schema } from "./schema";

export { EndingCredits };
export { schema, defaultValues } from "./schema";

registerSlide("ending-credits", EndingCredits, schema);
