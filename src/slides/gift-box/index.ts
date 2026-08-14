import { registerSlide } from "../registry";
import GiftBox from "./GiftBox";

export { GiftBox };
export { schema, defaultValues } from "./schema";

registerSlide("gift-box", GiftBox);
