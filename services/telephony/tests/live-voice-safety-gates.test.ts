import { describe, expect, it } from "vitest";
import { evaluateOutboundLiveCallSafety, evaluateProductionVoiceSafety } from "../src/live-voice-safety-gates";
import { getLiveProviderRuntimeConfig } from "../src/provider-readiness";

describe("live voice safety gates", () => {
  it("blocks production calls by default", () => {
    const result = evaluateProductionVoiceSafety(getLiveProviderRuntimeConfig({}));

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("PRODUCTION_CALLS_DISABLED");
    expect(result.reasonCodes).toContain("VOICE_AGENT_DISABLED");
  });

  it("blocks production voice when test mode remains enabled", () => {
    const result = evaluateProductionVoiceSafety(
      getLiveProviderRuntimeConfig({
        ALLOW_PRODUCTION_CALLS: "true",
        LIVE_INBOUND_CALLS_ENABLED: "true",
        OPENAI_API_KEY: "sk-test",
        OPENAI_REALTIME_MODEL: "gpt-realtime",
        TELEPHONY_PROVIDER: "twilio",
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token",
        TWILIO_PHONE_NUMBER: "+15551234567",
        VOICE_AGENT_ENABLED: "true"
      })
    );

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("TEST_MODE_ENABLED");
  });

  it("blocks outbound calls when outbound flag is disabled", () => {
    const result = evaluateOutboundLiveCallSafety({
      approvalStatus: "approved",
      config: getLiveProviderRuntimeConfig({}),
      requestStatus: "approved"
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("OUTBOUND_CALLS_DISABLED");
  });

  it("blocks outbound calls when the request is not approved", () => {
    const result = evaluateOutboundLiveCallSafety({
      approvalStatus: "pending",
      config: getLiveProviderRuntimeConfig({ OUTBOUND_CALLS_ENABLED: "true" }),
      requestStatus: "pending_approval"
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("OUTBOUND_REQUEST_NOT_APPROVED");
  });
});

