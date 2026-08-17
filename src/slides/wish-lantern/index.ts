import { registerSlide } from "../registry";
import WishLantern from "./WishLantern";
import { schema } from "./schema";

export { WishLantern };
export { schema, defaultValues } from "./schema";

registerSlide("wish-lantern", WishLantern, schema);
