import type { IntentReasonCode, IntentTier } from "@bidayax/types";

export const intentTierLabels = {
  "Cold Signal": "Cold Signal",
  "Warm Signal": "Warm Signal",
  "Qualified Signal": "Qualified Signal",
  "Executive Priority": "Executive Priority",
  "Strategic Opportunity": "Strategic Opportunity"
} as const satisfies Record<IntentTier, string>;

export const intentReasonLabels = {
  NO_EVENTS: "No events",
  QR_SCANNED: "QR scanned",
  CARD_VIEWED: "Card viewed",
  CARD_SHARED: "Card shared",
  WEBSITE_VISITED: "Website visited",
  VCARD_DOWNLOADED: "vCard downloaded",
  EMAIL_CLICKED: "Email clicked",
  CALL_CLICKED: "Call clicked",
  REPEAT_ENGAGEMENT: "Repeat engagement",
  HIGH_ACTION_DEPTH: "High action depth",
  RECENT_ACTIVITY: "Recent activity",
  MULTI_ACTION_SESSION: "Multi-action session",
  KNOWN_REFERRER: "Known referrer",
  DEVICE_CONTEXT_PRESENT: "Device context present"
} as const satisfies Record<IntentReasonCode, string>;

export function formatScore(value: number) {
  return `${Math.round(value)}/100`;
}
