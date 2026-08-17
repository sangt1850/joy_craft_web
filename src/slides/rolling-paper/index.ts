import { registerSlide } from "../registry";
import RollingPaper from "./RollingPaper";
import { schema } from "./schema";

export { RollingPaper };
export { schema, defaultValues } from "./schema";

registerSlide("rolling-paper", RollingPaper, schema);
