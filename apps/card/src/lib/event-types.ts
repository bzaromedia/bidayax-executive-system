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
  "share_click"
] as const;
