import { registerSlide } from "../registry";
import VinylPlayer from "./VinylPlayer";
import { schema } from "./schema";

export { VinylPlayer };
export { schema, defaultValues } from "./schema";

registerSlide("vinyl-player", VinylPlayer, schema);
