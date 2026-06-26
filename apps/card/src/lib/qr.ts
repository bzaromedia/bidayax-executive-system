import type { ExecutiveProfile } from "../data/executives";
import { getCardUrl } from "./routes";

export function getExecutiveQrValue(executive: Pick<ExecutiveProfile, "slug">) {
  return getCardUrl(executive);
}
