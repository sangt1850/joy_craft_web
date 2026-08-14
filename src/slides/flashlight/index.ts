import { registerSlide } from "../registry";
import Flashlight from "./Flashlight";

export { Flashlight };
export { schema, defaultValues } from "./schema";

registerSlide("flashlight", Flashlight);
