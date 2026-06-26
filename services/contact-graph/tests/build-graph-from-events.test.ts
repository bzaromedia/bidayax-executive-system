import { describe, expect, it } from "vitest";
import type {
  ContactGraphInteractionEvent,
  ContactGraphIntentScore,
  InteractionEventType
} from "@bidayax/types";
import { buildGraphFromEvents } from "../src/build-graph-from-events";

function event(
  id: string,
  eventType: InteractionEventType,
  createdAt = "2026-06-26T11:00:00.000Z"
): ContactGraphInteractionEvent {
  return {
    anonymousVisitorId: "bxv_test",
    browser: "chrome",
    createdAt,
    deviceType: "desktop",
    eventType,
    executiveSlug: "ad-garner",
    id,
    os: "windows",
    referrer: "https://example.com",
    sessionId: "bxs_test",
    sourceUrl: "https://bidayax.com/card/ad-garner"
  };
}

function score(id = "score_test"): ContactGraphIntentScore {
  return {
    anonymousVisitorId: "bxv_test",
    eventCount: 2,
    executiveSlug: "ad-garner",
    firstEventAt: "2026-06-26T11:00:00.000Z",
    id,
    lastEventAt: "2026-06-26T11:05:00.000Z",
    reasonCodes: ["CARD_VIEWED", "CALL_CLICKED"],
    score: 82,
    scoringVersion: "v1.0.0",
    sessionId: "bxs_test",
    tier: "Executive Priority"
  };
}

describe("buildGraphFromEvents", () => {
  it("creates a visitor node", () => {
    const result = buildGraphFromEvents({
      events: [event("event_1", "card_view")],
      intentScores: []
    });

    expect(result.nodes).toContainEqual(
      expect.objectContaining({
        nodeType: "visitor",
        stableKey: "visitor:bxv_test"
      })
    );
  });

  it("creates a session node", () => {
    const result = buildGraphFromEvents({
      events: [event("event_1", "card_view")],
      intentScores: []
    });

    expect(result.nodes).toContainEqual(
      expect.objectContaining({
        nodeType: "session",
        stableKey: "session:bxs_test"
      })
    );
  });

  it("creates an executive node", () => {
    const result = buildGraphFromEvents({
      events: [event("event_1", "card_view")],
      intentScores: []
    });

    expect(result.nodes).toContainEqual(
      expect.objectContaining({
        nodeType: "executive",
        stableKey: "executive:ad-garner"
      })
    );
  });

  it("creates an interaction event node", () => {
    const result = buildGraphFromEvents({
      events: [event("event_1", "card_view")],
      intentScores: []
    });

    expect(result.nodes).toContainEqual(
      expect.objectContaining({
        nodeType: "interaction_event",
        stableKey: "interaction_event:event_1"
      })
    );
  });

  it("creates an intent score node", () => {
    const result = buildGraphFromEvents({
      events: [],
      intentScores: [score()]
    });

    expect(result.nodes).toContainEqual(
      expect.objectContaining({
        nodeType: "intent_score",
        stableKey: "intent_score:score_test"
      })
    );
  });

  it("creates graph edges between visitor, session, event, executive, and score nodes", () => {
    const result = buildGraphFromEvents({
      events: [
        event("event_1", "card_view"),
        event("event_2", "call_click", "2026-06-26T11:05:00.000Z")
      ],
      intentScores: [score()]
    });

    expect(result.edges.map((edge) => edge.edgeType)).toEqual(
      expect.arrayContaining([
        "visitor_has_session",
        "session_viewed_executive",
        "session_generated_event",
        "event_targets_executive",
        "session_has_intent_score",
        "visitor_engaged_executive"
      ])
    );
  });

  it("prevents duplicate nodes and edges", () => {
    const duplicateEvent = event("event_1", "card_view");
    const result = buildGraphFromEvents({
      events: [duplicateEvent, duplicateEvent],
      intentScores: [score(), score()]
    });

    expect(result.nodes.filter((node) => node.stableKey === "visitor:bxv_test")).toHaveLength(1);
    expect(result.edges).toHaveLength(new Set(result.edges.map((edge) => `${edge.edgeType}:${edge.sourceStableKey}->${edge.targetStableKey}`)).size);
    expect(result.duplicateNodesSkipped).toBeGreaterThan(0);
    expect(result.duplicateEdgesSkipped).toBeGreaterThan(0);
  });

  it("handles empty input", () => {
    const result = buildGraphFromEvents({
      events: [],
      intentScores: []
    });

    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.snapshots).toEqual([]);
  });

  it("is deterministic for identical input", () => {
    const input = {
      events: [
        event("event_1", "card_view"),
        event("event_2", "call_click", "2026-06-26T11:05:00.000Z")
      ],
      intentScores: [score()]
    };

    expect(buildGraphFromEvents(input)).toEqual(buildGraphFromEvents(input));
  });
});
