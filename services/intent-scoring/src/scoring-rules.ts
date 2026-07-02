import type { IntentReasonCode, InteractionEventType } from "@bidayax/types";

export const eventTypeBaseScores = {
  qr_scan: 4,
  card_view: 5,
  website_click: 15,
  share_click: 18,
  vcard_download: 25,
  email_click: 35,
  call_click: 45,
  receptionist_request_started: 20,
  receptionist_request_submitted: 38,
  receptionist_request_failed: 0,
  receptionist_meeting_requested: 42,
  receptionist_callback_requested: 44,
  receptionist_lead_qualified: 50
} as const satisfies Record<InteractionEventType, number>;

export const eventTypeReasonCodes = {
  qr_scan: "QR_SCANNED",
  card_view: "CARD_VIEWED",
  website_click: "WEBSITE_VISITED",
  share_click: "CARD_SHARED",
  vcard_download: "VCARD_DOWNLOADED",
  email_click: "EMAIL_CLICKED",
  call_click: "CALL_CLICKED",
  receptionist_request_started: "RECEPTIONIST_REQUEST_STARTED",
  receptionist_request_submitted: "RECEPTIONIST_REQUEST_SUBMITTED",
  receptionist_request_failed: "RECEPTIONIST_REQUEST_FAILED",
  receptionist_meeting_requested: "MEETING_REQUESTED",
  receptionist_callback_requested: "CALLBACK_REQUESTED",
  receptionist_lead_qualified: "LEAD_QUALIFIED"
} as const satisfies Record<InteractionEventType, IntentReasonCode>;

export const actionDepthScores = {
  qr_scan: 0,
  card_view: 0,
  website_click: 8,
  share_click: 10,
  vcard_download: 12,
  email_click: 16,
  call_click: 20,
  receptionist_request_started: 10,
  receptionist_request_submitted: 16,
  receptionist_request_failed: 0,
  receptionist_meeting_requested: 20,
  receptionist_callback_requested: 20,
  receptionist_lead_qualified: 24
} as const satisfies Record<InteractionEventType, number>;

export const scoringRules = {
  deviceContextBonus: 2,
  knownReferrerBonus: 4,
  maxRepeatEngagementBonus: 18,
  multiActionSessionBonus: 10,
  repeatEngagementStep: 6,
  sameDayRecencyBonus: 12,
  sevenDayRecencyBonus: 6,
  thirtyDayRecencyBonus: 2,
  strategicOpportunityCap: 100
} as const;
