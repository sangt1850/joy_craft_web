import { registerSlide } from "../registry";
import PassportTicket from "./PassportTicket";
import { schema } from "./schema";

export { PassportTicket };
export { schema, defaultValues } from "./schema";

registerSlide("passport-ticket", PassportTicket, schema);
