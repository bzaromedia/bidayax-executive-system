import type {
  ContactGraphInteractionEvent,
  ContactGraphSnapshot,
  ExecutiveSlug
} from "@bidayax/types";

const executiveLabels = {
  "ad-garner": "A.D Garner",
  "naimah-barnes": "Naimah J. Barnes",
  "sean-hall": "Sean Hall"
} as const satisfies Record<ExecutiveSlug, string>;

const eventSummaryPhrases = {
  qr_scan: "opened the QR card route",
  card_view: "viewed the card",
  vcard_download: "downloaded the vCard",
  call_click: "clicked call",
  email_click: "clicked email",
  website_click: "visited the website",
  share_click: "shared the card",
  calendar_view: "opened the meeting calendar",
  calendar_slot_selected: "selected a meeting slot",
  calendar_request_submitted: "submitted a meeting request",
  calendar_request_failed: "encountered a meeting request issue",
  receptionist_request_started: "started a receptionist request",
  receptionist_request_submitted: "submitted a receptionist request",
  receptionist_request_failed: "encountered a receptionist request issue",
  receptionist_meeting_requested: "requested a meeting",
  receptionist_callback_requested: "requested a callback",
  receptionist_lead_qualified: "submitted a qualified lead request"
} as const;

function toTimestamp(value: string) {
  return new Date(value).getTime();
}

function joinPhrases(phrases: readonly string[]) {
  if (phrases.length === 0) {
    return "";
  }

  if (phrases.length === 1) {
    return phrases[0] ?? "";
  }

  if (phrases.length === 2) {
    return `${phrases[0]} and ${phrases[1]}`;
  }

  return `${phrases.slice(0, -1).join(", ")}, and ${phrases.at(-1)}`;
}

export function createEngagementSummary({
  events,
  executiveSlug
}: {
  readonly events: readonly ContactGraphInteractionEvent[];
  readonly executiveSlug: ExecutiveSlug;
}) {
  const executiveName = executiveLabels[executiveSlug];

  if (events.length === 0) {
    return `Anonymous visitor has no recorded engagement for ${executiveName}.`;
  }

  const orderedEvents = [...events].sort(
    (left, right) => toTimestamp(left.createdAt) - toTimestamp(right.createdAt)
  );
  const uniquePhrases = Array.from(
    new Set(orderedEvents.map((event) => eventSummaryPhrases[event.eventType]))
  );

  return `Anonymous visitor ${joinPhrases(uniquePhrases)} for ${executiveName}.`;
}

export function createGraphSnapshot({
  anonymousVisitorId,
  events,
  executiveSlug,
  highestIntentScore,
  highestIntentTier,
  lastActivityAt,
  sessionId
}: {
  readonly anonymousVisitorId: string;
  readonly events: readonly ContactGraphInteractionEvent[];
  readonly executiveSlug: ExecutiveSlug;
  readonly highestIntentScore: number | null;
  readonly highestIntentTier: ContactGraphSnapshot["highestIntentTier"];
  readonly lastActivityAt: string | null;
  readonly sessionId: string;
}): ContactGraphSnapshot {
  return {
    anonymousVisitorId,
    engagementSummary: createEngagementSummary({
      events,
      executiveSlug
    }),
    executiveSlug,
    highestIntentScore,
    highestIntentTier,
    lastActivityAt,
    sessionId,
    totalEvents: events.length
  };
}
