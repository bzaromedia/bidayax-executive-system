import {
  executiveCardBaseUrl,
  getExecutiveCardUrl,
  type ExecutiveProfile
} from "@bidayax/config/executives";

export const publicBaseUrl = executiveCardBaseUrl;

export function getCardPath(executive: Pick<ExecutiveProfile, "slug">) {
  return `/card/${executive.slug}`;
}

export function getCardUrl(executive: Pick<ExecutiveProfile, "slug">) {
  return getExecutiveCardUrl(executive);
}

export function getCardQrUrl(executive: Pick<ExecutiveProfile, "slug">) {
  const url = new URL(getCardUrl(executive));
  url.searchParams.set("entry", "qr");

  return url.toString();
}
