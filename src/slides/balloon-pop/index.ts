import { registerSlide } from "../registry";
import BalloonPop from "./BalloonPop";
import { schema } from "./schema";

export { BalloonPop };
export { schema, defaultValues } from "./schema";

registerSlide("balloon-pop", BalloonPop, schema);
