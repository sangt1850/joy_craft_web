import { registerSlide } from "../registry";
import FleetingButton from "./FleetingButton";
import { schema } from "./schema";

export { FleetingButton };
export { schema, defaultValues } from "./schema";

registerSlide("fleeing-button", FleetingButton, schema);
