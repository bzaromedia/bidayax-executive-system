import { describe, expect, it } from "vitest";
import type { ExecutiveSlug, InteractionEventType } from "@bidayax/types";
import { scoreEventGroup } from "../src/score-event-group";

const scoredAt = "2026-06-26T12:00:00.000Z";

function event(
  eventType: InteractionEventType,
  createdAt = "2026-06-26T11:45:00.000Z",
  executiveSlug: ExecutiveSlug = "ad-garner"
) {
  return {
    anonymousVisitorId: "bxv_test",
    browser: "chrome",
    createdAt,
    deviceType: "desktop",
    eventType,
    executiveSlug,
    id: `${eventType}-${createdAt}`,
    os: "windows",
    referrer: "https://example.com",
    sessionId: "bxs_test",
    sourceUrl: "https://bidayax.com/card/ad-garner"
  } as const;
}

describe("scoreEventGroup", () => {
  it("scores a single card_view as a cold signal", () => {
    const result = scoreEventGroup({
      events: [event("card_view")],
      scoredAt
    });

    expect(result.score).toBe(23);
    expect(result.tier).toBe("Cold Signal");
    expect(result.reasonCodes).toContain("CARD_VIEWED");
  });

  it("scores website_click above card_view", () => {
    const result = scoreEventGroup({
      events: [event("website_click")],
      scoredAt
    });

    expect(result.score).toBeGreaterThan(23);
    expect(result.reasonCodes).toContain("WEBSITE_VISITED");
    expect(result.reasonCodes).toContain("HIGH_ACTION_DEPTH");
  });

  it("scores vcard_download as stronger than website_click", () => {
    const website = scoreEventGroup({
      events: [event("website_click")],
      scoredAt
    });
    const vcard = scoreEventGroup({
      events: [event("vcard_download")],
      scoredAt
    });

    expect(vcard.score).toBeGreaterThan(website.score);
    expect(vcard.reasonCodes).toContain("VCARD_DOWNLOADED");
  });

  it("scores email_click as stronger than vcard_download", () => {
    const vcard = scoreEventGroup({
      events: [event("vcard_download")],
      scoredAt
    });
    const email = scoreEventGroup({
      events: [event("email_click")],
      scoredAt
    });

    expect(email.score).toBeGreaterThan(vcard.score);
    expect(email.reasonCodes).toContain("EMAIL_CLICKED");
  });

  it("scores call_click as the strongest single action", () => {
    const email = scoreEventGroup({
      events: [event("email_click")],
      scoredAt
    });
    const call = scoreEventGroup({
      events: [event("call_click")],
      scoredAt
    });

    expect(call.score).toBeGreaterThan(email.score);
    expect(call.reasonCodes).toContain("CALL_CLICKED");
  });

  it("adds repeat engagement for multiple events", () => {
    const result = scoreEventGroup({
      events: [
        event("card_view", "2026-06-26T11:30:00.000Z"),
        event("website_click", "2026-06-26T11:35:00.000Z")
      ],
      scoredAt
    });

    expect(result.score).toBeGreaterThan(40);
    expect(result.reasonCodes).toContain("REPEAT_ENGAGEMENT");
  });

  it("adds multi-action session for compact multi-action behavior", () => {
    const result = scoreEventGroup({
      events: [
        event("card_view", "2026-06-26T11:10:00.000Z"),
        event("website_click", "2026-06-26T11:15:00.000Z"),
        event("email_click", "2026-06-26T11:20:00.000Z")
      ],
      scoredAt
    });

    expect(result.reasonCodes).toContain("MULTI_ACTION_SESSION");
  });

  it("assigns tier boundaries deterministically", () => {
    const result = scoreEventGroup({
      events: [
        event("card_view", "2026-06-26T11:00:00.000Z"),
        event("website_click", "2026-06-26T11:05:00.000Z"),
        event("vcard_download", "2026-06-26T11:10:00.000Z"),
        event("email_click", "2026-06-26T11:15:00.000Z"),
        event("call_click", "2026-06-26T11:20:00.000Z")
      ],
      scoredAt
    });

    expect(result.score).toBe(100);
    expect(result.tier).toBe("Strategic Opportunity");
  });

  it("handles an empty event group", () => {
    const result = scoreEventGroup({
      events: [],
      scoredAt
    });

    expect(result.score).toBe(0);
    expect(result.tier).toBe("Cold Signal");
    expect(result.reasonCodes).toEqual(["NO_EVENTS"]);
  });

  it("returns the same score for identical input", () => {
    const input = {
      events: [
        event("card_view", "2026-06-26T11:00:00.000Z"),
        event("call_click", "2026-06-26T11:10:00.000Z")
      ],
      scoredAt
    };

    expect(scoreEventGroup(input)).toEqual(scoreEventGroup(input));
  });
});
