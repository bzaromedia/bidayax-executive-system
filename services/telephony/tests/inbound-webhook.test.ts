import { describe, expect, it } from "vitest";
import { normalizeInboundWebhook } from "../src/inbound-webhook";

describe("normalizeInboundWebhook", () => {
  it("normalizes a mock inbound webhook", () => {
    const result = normalizeInboundWebhook({
      executiveSlug: "ad-garner",
      fromNumber: "+15551234567",
      language: "English",
      provider: "mock",
      providerCallId: "mock_call_1",
      toNumber: "+15557654321"
    });

    expect(result).toEqual(
      expect.objectContaining({
        direction: "inbound",
        executiveSlug: "ad-garner",
        provider: "mock",
        status: "received"
      })
    );
  });

  it("rejects an invalid inbound webhook", () => {
    expect(() => normalizeInboundWebhook({ provider: "mock" })).toThrow(
      "Invalid mock inbound webhook payload."
    );
  });
});
