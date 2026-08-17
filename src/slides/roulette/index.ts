import { registerSlide } from "../registry";
import Roulette from "./Roulette";
import { schema } from "./schema";

export { Roulette };
export { schema, defaultValues } from "./schema";

registerSlide("roulette", Roulette, schema);
