import { describe, expect, it } from "vitest";
import {
  evaluateOutboundCallSafety,
  getTelephonyRuntimeConfig
} from "../src/telephony-safety-gates";
import { MockTelephonyProvider } from "../src/mock-telephony-provider";

describe("telephony safety gates", () => {
  it("uses safe defaults", () => {
    const config = getTelephonyRuntimeConfig({});

    expect(config.provider).toBe("mock");
    expect(config.outboundCallsEnabled).toBe(false);
    expect(config.voiceAgentEnabled).toBe(false);
    expect(config.requireHumanApproval).toBe(true);
  });

  it("requires approval by default", () => {
    const result = evaluateOutboundCallSafety({
      approvalStatus: "pending",
      config: getTelephonyRuntimeConfig({})
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("HUMAN_APPROVAL_REQUIRED");
  });

  it("validates mock provider config", () => {
    const provider = new MockTelephonyProvider();
    const result = provider.validateProviderConfig(getTelephonyRuntimeConfig({}));

    expect(result.valid).toBe(true);
    expect(result.provider).toBe("mock");
  });
});
