import { registerSlide } from "../registry";
import GiftBox from "./GiftBox";
import { schema } from "./schema";

export { GiftBox };
export { schema, defaultValues } from "./schema";

registerSlide("gift-box", GiftBox, schema);
