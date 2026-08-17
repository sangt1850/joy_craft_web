import { registerSlide } from "../registry";
import PhotoPuzzle from "./PhotoPuzzle";
import { schema } from "./schema";

export { PhotoPuzzle };
export { schema, defaultValues } from "./schema";

registerSlide("photo-puzzle", PhotoPuzzle, schema);
