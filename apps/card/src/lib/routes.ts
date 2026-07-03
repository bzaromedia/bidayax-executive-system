import {
  executiveCardBaseUrl,
  getExecutiveCardUrl,
  type ExecutiveProfile
} from "@bidayax/config/executives";

export const publicBaseUrl = executiveCardBaseUrl;

export function getCardPath(executive: Pick<ExecutiveProfile, "slug">) {
  return `/card/${executive.slug}`;
}

export function getCardCalendarPath(executive: Pick<ExecutiveProfile, "slug">) {
  return `/card/${executive.slug}/calendar`;
}

export function getCardUrl(executive: Pick<ExecutiveProfile, "slug">) {
  return getExecutiveCardUrl(executive);
}

export function getCardCalendarUrl(executive: Pick<ExecutiveProfile, "slug">) {
  return `${getCardUrl(executive)}/calendar`;
}

export function getCardQrUrl(executive: Pick<ExecutiveProfile, "slug">) {
  const url = new URL(getCardUrl(executive));
  url.searchParams.set("source", "qr");

  return url.toString();
}
