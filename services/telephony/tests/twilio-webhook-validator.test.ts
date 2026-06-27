import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateTwilioWebhookSignature } from "../src/twilio-webhook-validator";

describe("Twilio webhook validator", () => {
  it("fails closed in production when signing is disabled", () => {
    const result = validateTwilioWebhookSignature({
      authToken: null,
      headers: {},
      params: {},
      productionMode: true,
      rawBody: "",
      signingEnabled: false,
      url: "https://example.com/api/telephony/twilio/inbound"
    });

    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain("WEBHOOK_SIGNATURE_REQUIRED");
  });

  it("passes local mode when signing is disabled", () => {
    const result = validateTwilioWebhookSignature({
      authToken: null,
      headers: {},
      params: {},
      productionMode: false,
      rawBody: "",
      signingEnabled: false,
      url: "http://localhost:3001/api/telephony/twilio/inbound"
    });

    expect(result.valid).toBe(true);
    expect(result.signingChecked).toBe(false);
  });

  it("validates an HMAC signature when signing is enabled", () => {
    const url = "https://example.com/api/telephony/twilio/inbound";
    const params = { CallSid: "CA123", From: "+15551234567", To: "+15557654321" };
    const base = `${url}${Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}${value}`)
      .join("")}`;
    const signature = createHmac("sha1", "secret").update(base).digest("base64");

    const result = validateTwilioWebhookSignature({
      authToken: "secret",
      headers: { "x-twilio-signature": signature },
      params,
      productionMode: true,
      rawBody: "",
      signingEnabled: true,
      url
    });

    expect(result.valid).toBe(true);
  });
});

