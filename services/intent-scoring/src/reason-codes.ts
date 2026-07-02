import type { IntentReasonCode } from "@bidayax/types";

export const reasonCodeDescriptions = {
  NO_EVENTS: "No interaction events were available for scoring.",
  QR_SCANNED: "The executive card was opened from a QR-marked route.",
  CARD_VIEWED: "The executive card was viewed.",
  CARD_SHARED: "The executive card was shared.",
  WEBSITE_VISITED: "The website action was clicked.",
  VCARD_DOWNLOADED: "The vCard action was downloaded.",
  EMAIL_CLICKED: "The email action was clicked.",
  CALL_CLICKED: "The call action was clicked.",
  CALENDAR_VIEWED: "The internal calendar route was viewed.",
  CALENDAR_SLOT_SELECTED: "The visitor selected an internal calendar availability window.",
  CALENDAR_REQUEST_SUBMITTED: "The visitor submitted an internal calendar meeting request.",
  CALENDAR_REQUEST_FAILED: "An internal calendar meeting request failed validation or storage.",
  RECEPTIONIST_REQUEST_STARTED: "A receptionist workflow request was started.",
  RECEPTIONIST_REQUEST_SUBMITTED: "A receptionist workflow request was submitted.",
  RECEPTIONIST_REQUEST_FAILED: "A receptionist workflow request failed validation or storage.",
  MEETING_REQUESTED: "The visitor requested a meeting through the receptionist workflow.",
  CALLBACK_REQUESTED: "The visitor requested a callback through the receptionist workflow.",
  LEAD_QUALIFIED: "The visitor submitted a qualified lead request through the receptionist workflow.",
  REPEAT_ENGAGEMENT: "Multiple events were recorded in the same anonymous signal group.",
  HIGH_ACTION_DEPTH: "The signal included a deeper action than a passive card view.",
  RECENT_ACTIVITY: "The latest activity is recent relative to the scoring timestamp.",
  MULTI_ACTION_SESSION: "Multiple action types occurred in a compact session.",
  KNOWN_REFERRER: "The event group included source or referrer context.",
  DEVICE_CONTEXT_PRESENT: "Coarse device, browser, and OS context was available."
} as const satisfies Record<IntentReasonCode, string>;
