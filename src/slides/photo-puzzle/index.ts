import { registerSlide } from "../registry";
import PhotoPuzzle from "./PhotoPuzzle";

export { PhotoPuzzle };
export { schema, defaultValues } from "./schema";

registerSlide("photo-puzzle", PhotoPuzzle);
