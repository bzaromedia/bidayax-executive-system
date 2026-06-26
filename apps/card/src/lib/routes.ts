import type { ExecutiveProfile } from "../data/executives";

export const publicBaseUrl = "https://bidayax.com";

export function getCardPath(executive: Pick<ExecutiveProfile, "slug">) {
  return `/card/${executive.slug}`;
}

export function getCardUrl(executive: Pick<ExecutiveProfile, "slug">) {
  return `${publicBaseUrl}${getCardPath(executive)}`;
}
