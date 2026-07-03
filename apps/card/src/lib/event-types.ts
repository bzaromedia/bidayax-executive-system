export {
  executiveSlugs,
  interactionEventTypes,
  isExecutiveSlug,
  isInteractionEventType
} from "@bidayax/types";

export type {
  ExecutiveSlug,
  InteractionEventDeviceInfo,
  InteractionEventMetadata,
  InteractionEventRecord,
  InteractionEventRequest,
  InteractionEventType
} from "@bidayax/types";

export const cardLoadEventTypes = ["qr_scan", "card_view"] as const;

export const cardActionEventTypes = [
  "vcard_download",
  "call_click",
  "email_click",
  "website_click",
  "share_click",
  "qr_transfer_detected",
  "qr_transfer_success_feedback",
  "qr_transfer_failure_feedback",
  "qr_transfer_haptics_toggled",
  "qr_transfer_sound_toggled",
  "qr_transfer_animation_toggled",
  "calendar_view",
  "calendar_slot_selected",
  "calendar_request_submitted",
  "calendar_request_failed",
  "receptionist_request_started",
  "receptionist_request_submitted",
  "receptionist_request_failed",
  "receptionist_meeting_requested",
  "receptionist_callback_requested",
  "receptionist_lead_qualified"
] as const;
