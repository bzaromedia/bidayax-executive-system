import { describe, expect, it } from "vitest";
import type { ContactGraphInteractionEvent } from "@bidayax/types";
import { createGraphSnapshot } from "../src/graph-snapshot";

function event(eventType: ContactGraphInteractionEvent["eventType"]) {
  return {
    anonymousVisitorId: "bxv_test",
    browser: "chrome",
    createdAt: "2026-06-26T11:00:00.000Z",
    deviceType: "desktop",
    eventType,
    executiveSlug: "ad-garner",
    id: `event_${eventType}`,
    os: "windows",
    referrer: null,
    sessionId: "bxs_test",
    sourceUrl: null
  } satisfies ContactGraphInteractionEvent;
}

describe("createGraphSnapshot", () => {
  it("creates a factual relationship snapshot", () => {
    const snapshot = createGraphSnapshot({
      anonymousVisitorId: "bxv_test",
      events: [event("card_view"), event("vcard_download"), event("call_click")],
      executiveSlug: "ad-garner",
      highestIntentScore: 82,
      highestIntentTier: "Executive Priority",
      lastActivityAt: "2026-06-26T11:05:00.000Z",
      sessionId: "bxs_test"
    });

    expect(snapshot.totalEvents).toBe(3);
    expect(snapshot.highestIntentTier).toBe("Executive Priority");
    expect(snapshot.engagementSummary).toBe(
      "Anonymous visitor viewed the card, downloaded the vCard, and clicked call for A.D Garner."
    );
  });

  it("keeps empty snapshots anonymous and non-speculative", () => {
    const snapshot = createGraphSnapshot({
      anonymousVisitorId: "bxv_test",
      events: [],
      executiveSlug: "ad-garner",
      highestIntentScore: null,
      highestIntentTier: null,
      lastActivityAt: null,
      sessionId: "bxs_test"
    });

    expect(snapshot.engagementSummary).toBe(
      "Anonymous visitor has no recorded engagement for A.D Garner."
    );
  });
});
