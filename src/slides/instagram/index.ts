import { registerSlide } from "../registry";
import Instagram from "./Instagram";
import { schema } from "./schema";

export { Instagram };
export { schema, defaultValues } from "./schema";

registerSlide("instagram", Instagram, schema);
registerSlide("moment-photoapp", Instagram, schema); // 기존 DB 레코드 하위호환
