import { describe, expect, it } from "vitest";
import {
  assertProviderImplementationDisabled,
  createInMemoryTelephonyDomainRepository,
  requestCallSession
} from "../src";

describe("telephony control plane", () => {
  it("creates provider-independent call session records without enabling calls", async () => {
    const repository = createInMemoryTelephonyDomainRepository();
    const result = await requestCallSession({
      input: {
        actorId: "system-test",
        callee: { phoneNumber: "+15555550101" },
        caller: { phoneNumber: "+15555550100" },
        cardId: "card-1",
        direction: "inbound",
        phoneNumberId: "phone-1",
        requestedAt: "2026-07-13T00:00:00.000Z",
        sessionId: "session-1",
        tenantId: "tenant-1"
      },
      repository
    });

    expect(result.accepted).toBe(true);
    expect(result.status).toBe("queued");
    expect(result.reasonCodes).toContain("PROVIDER_INDEPENDENT_CALL_SESSION_CREATED");
    expect(result.auditEvents[0]?.metadata).toMatchObject({
      productionCallingEnabled: false,
      providerIndependent: true
    });

    const sessions = await repository.listCallSessionsForTenant("tenant-1");
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.state).toBe("requested");
  });

  it("keeps provider operations disabled in Phase 6", () => {
    expect(assertProviderImplementationDisabled()).toEqual({
      accepted: false,
      providerReference: null,
      reasonCodes: ["PHASE_6_PROVIDER_INTERFACE_ONLY", "PRODUCTION_CALLING_DISABLED"]
    });
  });
});
