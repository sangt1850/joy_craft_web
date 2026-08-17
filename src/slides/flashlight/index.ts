import { registerSlide } from "../registry";
import Flashlight from "./Flashlight";
import { schema } from "./schema";

export { Flashlight };
export { schema, defaultValues } from "./schema";

registerSlide("flashlight", Flashlight, schema);
