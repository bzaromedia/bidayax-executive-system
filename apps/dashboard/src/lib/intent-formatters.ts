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
  QR_TRANSFER_DETECTED: "QR transfer detected",
  QR_TRANSFER_SUCCESS_FEEDBACK: "QR feedback confirmed",
  QR_TRANSFER_FAILURE_FEEDBACK: "QR feedback issue",
  QR_TRANSFER_HAPTICS_TOGGLED: "QR haptics setting changed",
  QR_TRANSFER_SOUND_TOGGLED: "QR sound setting changed",
  QR_TRANSFER_ANIMATION_TOGGLED: "QR animation setting changed",
  WEBSITE_VISITED: "Website visited",
  VCARD_DOWNLOADED: "vCard downloaded",
  EMAIL_CLICKED: "Email clicked",
  CALL_CLICKED: "Call clicked",
  CALENDAR_VIEWED: "Calendar viewed",
  CALENDAR_SLOT_SELECTED: "Calendar slot selected",
  CALENDAR_REQUEST_SUBMITTED: "Calendar request submitted",
  CALENDAR_REQUEST_FAILED: "Calendar request issue",
  RECEPTIONIST_REQUEST_STARTED: "Receptionist request started",
  RECEPTIONIST_REQUEST_SUBMITTED: "Receptionist request submitted",
  RECEPTIONIST_REQUEST_FAILED: "Receptionist request issue",
  MEETING_REQUESTED: "Meeting requested",
  CALLBACK_REQUESTED: "Callback requested",
  LEAD_QUALIFIED: "Lead qualified",
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
