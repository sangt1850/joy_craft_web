import { registerSlide } from "../registry";
import CassettePlayer from "./CassettePlayer";
export { CassettePlayer };
export { schema, defaultValues } from "./schema";
registerSlide("cassette-player", CassettePlayer);
