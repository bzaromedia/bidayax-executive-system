import type { ExecutiveProfile } from "@bidayax/config/executives";

export function getExecutiveQrValue(executive: Pick<ExecutiveProfile, "qrUrl">) {
  return executive.qrUrl;
}
