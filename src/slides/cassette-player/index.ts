import { registerSlide } from "../registry";
import CassettePlayer from "./CassettePlayer";
import { schema } from "./schema";

export { CassettePlayer };
export { schema, defaultValues } from "./schema";

registerSlide("cassette-player", CassettePlayer, schema);
