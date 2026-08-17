import { registerSlide } from "../registry";
import StoryBook from "./StoryBook";
import { schema } from "./schema";

export { StoryBook };
export { schema, defaultValues } from "./schema";

registerSlide("story-book", StoryBook, schema);
