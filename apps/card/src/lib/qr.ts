import type { ExecutiveProfile } from "../data/executives";
import { getCardQrUrl } from "./routes";

export function getExecutiveQrValue(executive: Pick<ExecutiveProfile, "slug">) {
  return getCardQrUrl(executive);
}
