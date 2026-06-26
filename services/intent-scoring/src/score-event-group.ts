import {
  intentScoringVersion,
  type ExecutiveSlug,
  type IntentReasonCode,
  type IntentScoreResult,
  type IntentScoringEvent,
  type InteractionEventType
} from "@bidayax/types";
import {
  actionDepthScores,
  eventTypeBaseScores,
  eventTypeReasonCodes,
  scoringRules
} from "./scoring-rules";
import { getIntentTier } from "./tiers";

export type ScoreEventGroupInput = {
  readonly events: readonly IntentScoringEvent[];
  readonly scoredAt: string;
};

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function addReason(
  reasons: Set<IntentReasonCode>,
  reasonCode: IntentReasonCode
) {
  reasons.add(reasonCode);
}

function toTimestamp(value: string) {
  return new Date(value).getTime();
}

function getGroupIdentity(events: readonly IntentScoringEvent[]) {
  const firstEvent = events[0];

  return {
    anonymousVisitorId: firstEvent?.anonymousVisitorId ?? "",
    executiveSlug: firstEvent?.executiveSlug ?? "ad-garner",
    sessionId: firstEvent?.sessionId ?? ""
  } satisfies {
    anonymousVisitorId: string;
    executiveSlug: ExecutiveSlug;
    sessionId: string;
  };
}

function getRecencyBonus(lastEventAt: string, scoredAt: string) {
  const ageInDays = Math.max(
    0,
    (toTimestamp(scoredAt) - toTimestamp(lastEventAt)) / 86_400_000
  );

  if (ageInDays <= 1) {
    return scoringRules.sameDayRecencyBonus;
  }

  if (ageInDays <= 7) {
    return scoringRules.sevenDayRecencyBonus;
  }

  if (ageInDays <= 30) {
    return scoringRules.thirtyDayRecencyBonus;
  }

  return 0;
}

function hasCompleteDeviceContext(events: readonly IntentScoringEvent[]) {
  return events.some((event) =>
    [event.deviceType, event.browser, event.os].every(
      (value) => value && value !== "unknown"
    )
  );
}

function hasKnownReferrer(events: readonly IntentScoringEvent[]) {
  return events.some((event) => Boolean(event.referrer ?? event.sourceUrl));
}

function getSessionDurationMinutes(events: readonly IntentScoringEvent[]) {
  const timestamps = events.map((event) => toTimestamp(event.createdAt));
  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);

  return (latest - earliest) / 60_000;
}

export function scoreEventGroup({
  events,
  scoredAt
}: ScoreEventGroupInput): IntentScoreResult {
  const orderedEvents = [...events].sort(
    (left, right) => toTimestamp(left.createdAt) - toTimestamp(right.createdAt)
  );
  const groupIdentity = getGroupIdentity(orderedEvents);
  const reasons = new Set<IntentReasonCode>();

  if (orderedEvents.length === 0) {
    addReason(reasons, "NO_EVENTS");

    return {
      ...groupIdentity,
      eventCount: 0,
      firstEventAt: null,
      lastEventAt: null,
      reasonCodes: Array.from(reasons),
      score: 0,
      scoringVersion: intentScoringVersion,
      tier: getIntentTier(0)
    };
  }

  const eventTypes = orderedEvents.map((event) => event.eventType);
  const uniqueEventTypes = unique(eventTypes);
  const firstEventAt = orderedEvents[0]?.createdAt ?? null;
  const lastEventAt = orderedEvents.at(-1)?.createdAt ?? null;
  let score = eventTypes.reduce(
    (total, eventType) => total + eventTypeBaseScores[eventType],
    0
  );

  for (const eventType of uniqueEventTypes) {
    addReason(reasons, eventTypeReasonCodes[eventType]);
  }

  if (orderedEvents.length > 1) {
    score += Math.min(
      (orderedEvents.length - 1) * scoringRules.repeatEngagementStep,
      scoringRules.maxRepeatEngagementBonus
    );
    addReason(reasons, "REPEAT_ENGAGEMENT");
  }

  const maxActionDepth = Math.max(
    ...eventTypes.map((eventType) => actionDepthScores[eventType])
  );

  if (maxActionDepth > 0) {
    score += maxActionDepth;
    addReason(reasons, "HIGH_ACTION_DEPTH");
  }

  if (lastEventAt) {
    const recencyBonus = getRecencyBonus(lastEventAt, scoredAt);

    if (recencyBonus > 0) {
      score += recencyBonus;
      addReason(reasons, "RECENT_ACTIVITY");
    }
  }

  const sessionActionTypes = unique(
    eventTypes.filter(
      (eventType): eventType is Exclude<InteractionEventType, "card_view" | "qr_scan"> =>
        eventType !== "card_view" && eventType !== "qr_scan"
    )
  );

  if (
    orderedEvents.length >= 3 &&
    sessionActionTypes.length >= 2 &&
    getSessionDurationMinutes(orderedEvents) <= 30
  ) {
    score += scoringRules.multiActionSessionBonus;
    addReason(reasons, "MULTI_ACTION_SESSION");
  }

  if (hasKnownReferrer(orderedEvents)) {
    score += scoringRules.knownReferrerBonus;
    addReason(reasons, "KNOWN_REFERRER");
  }

  if (hasCompleteDeviceContext(orderedEvents)) {
    score += scoringRules.deviceContextBonus;
    addReason(reasons, "DEVICE_CONTEXT_PRESENT");
  }

  const normalizedScore = Math.min(
    Math.round(score),
    scoringRules.strategicOpportunityCap
  );

  return {
    ...groupIdentity,
    eventCount: orderedEvents.length,
    firstEventAt,
    lastEventAt,
    reasonCodes: Array.from(reasons).sort(),
    score: normalizedScore,
    scoringVersion: intentScoringVersion,
    tier: getIntentTier(normalizedScore)
  };
}
