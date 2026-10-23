import { registerSlide } from "../registry";
import LoveflixIntro from "./LoveflixIntro";
import { schema } from "./schema";

export { LoveflixIntro };
export { schema, defaultValues } from "./schema";

registerSlide("loveflix-intro", LoveflixIntro, schema);
