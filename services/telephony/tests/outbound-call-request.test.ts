import { describe, expect, it } from "vitest";
import { createOutboundCallRequest } from "../src/outbound-call-request";
import { getTelephonyRuntimeConfig } from "../src/telephony-safety-gates";

describe("createOutboundCallRequest", () => {
  it("creates an outbound request pending approval by default", () => {
    const request = createOutboundCallRequest(
      {
        executiveSlug: "ad-garner",
        reason: "Simulated callback request",
        requestedBy: "operator",
        toNumber: "+15551234567"
      },
      getTelephonyRuntimeConfig({})
    );

    expect(request.approvalStatus).toBe("pending");
    expect(request.status).toBe("pending_approval");
  });

  it("blocks outbound calls by default", () => {
    const request = createOutboundCallRequest(
      {
        executiveSlug: "ad-garner",
        reason: "Simulated callback request",
        requestedBy: "operator",
        toNumber: "+15551234567"
      },
      getTelephonyRuntimeConfig({})
    );

    expect(request.safetyReasons).toContain("OUTBOUND_CALLS_DISABLED");
  });
});
