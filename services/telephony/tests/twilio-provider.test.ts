import { describe, expect, it } from "vitest";
import { TwilioProvider } from "../src/twilio-provider";
import { getTelephonyRuntimeConfig } from "../src/telephony-safety-gates";

describe("Twilio provider", () => {
  it("normalizes a Twilio-shaped inbound webhook payload", () => {
    const provider = new TwilioProvider();
    const normalized = provider.normalizeInboundWebhook({
      AccountSid: "AC123",
      CallSid: "CA123",
      From: "+15551234567",
      To: "+15557654321",
      executiveSlug: "ad-garner"
    });

    expect(normalized.provider).toBe("twilio");
    expect(normalized.providerCallId).toBe("CA123");
    expect(normalized.status).toBe("received");
  });

  it("rejects malformed Twilio payloads", () => {
    const provider = new TwilioProvider();

    expect(() => provider.normalizeInboundWebhook({ CallSid: "CA123" })).toThrow(
      "Malformed Twilio inbound webhook payload."
    );
  });

  it("validates Twilio configuration without exposing secrets", () => {
    const provider = new TwilioProvider();
    const result = provider.validateProviderConfig(
      getTelephonyRuntimeConfig({
        TELEPHONY_PROVIDER: "twilio",
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "secret",
        TWILIO_PHONE_NUMBER: "+15551234567"
      })
    );

    expect(result.valid).toBe(true);
    expect(result.reasonCodes).not.toContain("secret");
  });
});

