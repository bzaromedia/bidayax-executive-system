import type { ExecutiveSlug, InteractionEventType } from "./events";

export const intentScoringVersion = "v1.0.0" as const;

export type IntentScoringVersion = typeof intentScoringVersion;

export const intentTiers = [
  "Cold Signal",
  "Warm Signal",
  "Qualified Signal",
  "Executive Priority",
  "Strategic Opportunity"
] as const;

export type IntentTier = (typeof intentTiers)[number];

export const intentReasonCodes = [
  "NO_EVENTS",
  "QR_SCANNED",
  "CARD_VIEWED",
  "CARD_SHARED",
  "WEBSITE_VISITED",
  "VCARD_DOWNLOADED",
  "EMAIL_CLICKED",
  "CALL_CLICKED",
  "REPEAT_ENGAGEMENT",
  "HIGH_ACTION_DEPTH",
  "RECENT_ACTIVITY",
  "MULTI_ACTION_SESSION",
  "KNOWN_REFERRER",
  "DEVICE_CONTEXT_PRESENT"
] as const;

export type IntentReasonCode = (typeof intentReasonCodes)[number];

export type IntentScoringEvent = {
  readonly id: string;
  readonly eventType: InteractionEventType;
  readonly executiveSlug: ExecutiveSlug;
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
  readonly sourceUrl: string | null;
  readonly referrer: string | null;
  readonly deviceType: string | null;
  readonly browser: string | null;
  readonly os: string | null;
  readonly createdAt: string;
};

export type IntentScoreResult = {
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly score: number;
  readonly tier: IntentTier;
  readonly reasonCodes: readonly IntentReasonCode[];
  readonly scoringVersion: IntentScoringVersion;
  readonly eventCount: number;
  readonly firstEventAt: string | null;
  readonly lastEventAt: string | null;
};

export type IntentScoreRecord = IntentScoreResult & {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export function isIntentTier(value: string): value is IntentTier {
  return (intentTiers as readonly string[]).includes(value);
}

export function isIntentReasonCode(value: string): value is IntentReasonCode {
  return (intentReasonCodes as readonly string[]).includes(value);
}
