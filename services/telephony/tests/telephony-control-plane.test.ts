import { describe, expect, it } from "vitest";
import { createInMemoryTelephonyDomainRepository } from "../src/domain-repository";
import { assertProviderImplementationDisabled } from "../src/provider-interface";
import {
  createInMemoryTelephonyCommandIdempotencyStore,
  evaluateTelephonyCommandSafety,
  requestCallSession
} from "../src/telephony-control-plane";

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

  it("denies disabled telephony commands", () => {
    const decision = evaluateTelephonyCommandSafety({
      adapterRequired: false,
      context: {
        actorId: "user-1",
        cardId: "card-1",
        correlationId: "corr-1",
        idempotencyKey: "request-1",
        permissions: ["telephony.calls.request"],
        productionCallingEnabled: false,
        adapterConfigured: false,
        telephonyEnabled: false,
        tenantId: "tenant-1"
      },
      permission: "telephony.calls.request"
    });

    expect(decision).toEqual({
      accepted: false,
      reasonCodes: ["TELEPHONY_DISABLED"],
      status: "denied"
    });
  });

  it("denies provider commands when no adapter is configured", () => {
    const decision = evaluateTelephonyCommandSafety({
      context: {
        actorId: "user-1",
        cardId: "card-1",
        correlationId: "corr-1",
        idempotencyKey: "request-1",
        permissions: ["telephony.calls.request"],
        productionCallingEnabled: false,
        adapterConfigured: false,
        telephonyEnabled: true,
        tenantId: "tenant-1"
      },
      permission: "telephony.calls.request"
    });

    expect(decision.reasonCodes).toContain("PROVIDER_ADAPTER_NOT_CONFIGURED");
    expect(decision.accepted).toBe(false);
  });

  it("denies commands without the exact permission", () => {
    const decision = evaluateTelephonyCommandSafety({
      adapterRequired: false,
      context: {
        actorId: "user-1",
        cardId: "card-1",
        correlationId: "corr-1",
        idempotencyKey: "request-1",
        permissions: ["telephony.read"],
        productionCallingEnabled: false,
        adapterConfigured: true,
        telephonyEnabled: true,
        tenantId: "tenant-1"
      },
      permission: "telephony.calls.request"
    });

    expect(decision.reasonCodes).toContain("PERMISSION_DENIED");
  });

  it("deduplicates commands by idempotency key", () => {
    const store = createInMemoryTelephonyCommandIdempotencyStore();
    const context = {
      actorId: "user-1",
      cardId: "card-1",
      correlationId: "corr-1",
      idempotencyKey: "request-1",
      permissions: ["telephony.calls.request"],
      productionCallingEnabled: false,
      adapterConfigured: true,
      telephonyEnabled: true,
      tenantId: "tenant-1"
    };

    expect(
      evaluateTelephonyCommandSafety({
        context,
        idempotencyStore: store,
        permission: "telephony.calls.request"
      }).accepted
    ).toBe(true);
    expect(
      evaluateTelephonyCommandSafety({
        context,
        idempotencyStore: store,
        permission: "telephony.calls.request"
      })
    ).toEqual({
      accepted: false,
      reasonCodes: ["DUPLICATE_COMMAND"],
      status: "duplicate"
    });
  });

  it("rejects stale expected-version commands", () => {
    expect(
      evaluateTelephonyCommandSafety({
        adapterRequired: false,
        context: {
          actorId: "user-1",
          cardId: "card-1",
          correlationId: "corr-1",
          expectedVersion: 2,
          idempotencyKey: "request-1",
          permissions: ["telephony.calls.request"],
          productionCallingEnabled: false,
          adapterConfigured: true,
          telephonyEnabled: true,
          tenantId: "tenant-1"
        },
        currentVersion: 3,
        permission: "telephony.calls.request"
      })
    ).toEqual({
      accepted: false,
      reasonCodes: ["STALE_EXPECTED_VERSION"],
      status: "stale_version"
    });
  });
});