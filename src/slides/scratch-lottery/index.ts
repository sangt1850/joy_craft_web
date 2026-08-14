import { registerSlide } from "../registry";
import ScratchLottery from "./ScratchLottery";

export { ScratchLottery };
export { schema, defaultValues } from "./schema";

registerSlide("scratch-lottery", ScratchLottery);
