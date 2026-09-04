import { registerSlide } from "../registry";
import MatryoshkaDog from "./MatryoshkaDog";
import { schema } from "./schema";

export { MatryoshkaDog };
export { schema, defaultValues } from "./schema";

registerSlide("matryoshka-dog", MatryoshkaDog, schema);
