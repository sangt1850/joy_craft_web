import { registerSlide } from "../registry";
import Roulette from "./Roulette";

export { Roulette };
export { schema, defaultValues } from "./schema";

registerSlide("roulette", Roulette);
