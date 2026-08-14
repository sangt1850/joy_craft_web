import { registerSlide } from "../registry";
import StoryBook from "./StoryBook";
export { StoryBook };
export { schema, defaultValues } from "./schema";
registerSlide("story-book", StoryBook);
