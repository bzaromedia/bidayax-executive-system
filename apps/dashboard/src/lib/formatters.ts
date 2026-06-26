import type { ExecutiveSlug, InteractionEventType } from "@bidayax/types";

export const executiveLabels = {
  "ad-garner": "A.D Garner",
  "naimah-barnes": "Naimah J. Barnes",
  "sean-hall": "Sean Hall"
} as const satisfies Record<ExecutiveSlug, string>;

export const eventTypeLabels = {
  qr_scan: "QR scans",
  card_view: "Card views",
  vcard_download: "vCard downloads",
  call_click: "Call clicks",
  email_click: "Email clicks",
  website_click: "Website clicks"
} as const satisfies Record<InteractionEventType, string>;

export function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    style: "percent"
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function formatSource(value: string | null) {
  if (!value) {
    return "Direct or unavailable";
  }

  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return value;
  }
}
