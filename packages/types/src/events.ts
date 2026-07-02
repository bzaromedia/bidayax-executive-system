export const interactionEventTypes = [
  "qr_scan",
  "card_view",
  "vcard_download",
  "call_click",
  "email_click",
  "website_click",
  "share_click",
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

export type InteractionEventType = (typeof interactionEventTypes)[number];

export const executiveSlugs = [
  "ad-garner",
  "naimah-barnes",
  "sean-hall"
] as const;

export type ExecutiveSlug = (typeof executiveSlugs)[number];

export type InteractionEventMetadataValue = string | number | boolean | null;

export type InteractionEventMetadata = Record<
  string,
  InteractionEventMetadataValue
>;

export type InteractionEventRequest = {
  readonly eventType: InteractionEventType;
  readonly executiveSlug: ExecutiveSlug;
  readonly sessionId: string;
  readonly anonymousVisitorId: string;
  readonly sourceUrl?: string;
  readonly referrer?: string;
  readonly metadata?: InteractionEventMetadata;
};

export type InteractionEventDeviceInfo = {
  readonly deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  readonly browser: string;
  readonly os: string;
};

export type InteractionEventRecord = InteractionEventRequest &
  InteractionEventDeviceInfo & {
    readonly id: string;
    readonly userAgent: string | null;
    readonly ipHash: string | null;
    readonly createdAt: string;
  };

export function isInteractionEventType(
  value: string
): value is InteractionEventType {
  return (interactionEventTypes as readonly string[]).includes(value);
}

export function isExecutiveSlug(value: string): value is ExecutiveSlug {
  return (executiveSlugs as readonly string[]).includes(value);
}
