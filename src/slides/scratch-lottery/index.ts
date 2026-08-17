import { registerSlide } from "../registry";
import ScratchLottery from "./ScratchLottery";
import { schema } from "./schema";

export { ScratchLottery };
export { schema, defaultValues } from "./schema";

registerSlide("scratch-lottery", ScratchLottery, schema);
