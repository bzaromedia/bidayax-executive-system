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
  REPEAT_ENGAGEMENT: "Multiple events were recorded in the same anonymous signal group.",
  HIGH_ACTION_DEPTH: "The signal included a deeper action than a passive card view.",
  RECENT_ACTIVITY: "The latest activity is recent relative to the scoring timestamp.",
  MULTI_ACTION_SESSION: "Multiple action types occurred in a compact session.",
  KNOWN_REFERRER: "The event group included source or referrer context.",
  DEVICE_CONTEXT_PRESENT: "Coarse device, browser, and OS context was available."
} as const satisfies Record<IntentReasonCode, string>;
