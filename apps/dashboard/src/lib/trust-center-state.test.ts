import { describe, expect, it } from "vitest";
import { deriveTrustCenterState, resolveTrustCenterRequestScope, trustCenterReadinessLabel, type TrustCenterSnapshot, type TrustCenterState } from "./trust-center-state";
const now = "2026-07-17T12:00:00.000Z";
const operational: TrustCenterSnapshot = { activeKeys: 1, algorithmPolicyVersion: "trust-algorithm-policy-1", auditChainValid: true, compromisedKeys: 0, generatedAt: now, latestRotationAt: now, provenanceAvailable: true, providerStatus: "production", revokedKeys: 0, signedSettings: 2, verificationFailures: 0 };
describe("Trust Center exact state derivation", () => {
  it.each([
    [{ loading: true, now }, "loading"], [{ errorStatus: 401, now }, "unavailable"], [{ now, snapshot: null }, "unavailable"],
    [{ now, snapshot: operational }, "operational"], [{ now, snapshot: { ...operational, generatedAt: "2026-07-17T11:00:00.000Z" } }, "degraded"],
    [{ now, snapshot: { ...operational, verificationFailures: 1 } }, "verification_failed"], [{ now, snapshot: { ...operational, revokedKeys: 1 } }, "revoked_key"],
    [{ now, snapshot: { ...operational, providerStatus: "test" as const } }, "test_key_warning"], [{ now, snapshot: { ...operational, providerStatus: "unavailable" as const } }, "no_production_provider"],
    [{ now, snapshot: { ...operational, signedSettings: 0 } }, "no_signed_artifacts"]
  ] as const)("derives %#", (input, expected) => expect(deriveTrustCenterState(input)).toBe(expected));
});

describe("Trust Center readiness labels", () => {
  it.each([
    ["operational", "Ready"], ["degraded", "Review warnings"], ["verification_failed", "Verification failed"],
    ["unavailable", "Unavailable"], ["loading", "Checking"], ["no_production_provider", "Configuration required"],
    ["test_key_warning", "Test configuration"], ["no_signed_artifacts", "No signed artifacts"], ["revoked_key", "Revoked or compromised key"]
  ] as readonly [TrustCenterState, string][])("maps %s", (state, label) => expect(trustCenterReadinessLabel[state]).toBe(label));
  it("does not expose an impossible healthy state", () => expect(Object.keys(trustCenterReadinessLabel)).not.toContain("healthy"));
});

describe("Trust Center request scoping", () => {
  it("allows tenant administrators to request tenant-wide status", () => {
    const result = resolveTrustCenterRequestScope({ authenticated: true, session: { role: "tenant_admin", tenantId: "tenant-1" } }, null);
    expect(result.request).toBe(true);
    if (result.request) expect(result.params.toString()).toBe("tenantId=tenant-1");
  });
  it.each(["executive", "viewer"])("requires %s users to provide a selected card", (role) => {
    expect(resolveTrustCenterRequestScope({ authenticated: true, session: { role, tenantId: "tenant-1" } }, null)).toEqual({ reason: "card_required", request: false });
  });
  it.each(["executive", "viewer"])("scopes %s requests to the selected card", (role) => {
    const result = resolveTrustCenterRequestScope({ authenticated: true, session: { role, tenantId: "tenant-1" } }, "card-1");
    expect(result.request).toBe(true);
    if (result.request) expect(result.params.toString()).toBe("tenantId=tenant-1&cardId=card-1");
  });
  it("does not issue unauthenticated requests", () => expect(resolveTrustCenterRequestScope({ authenticated: false }, "card-1")).toEqual({ reason: "unauthenticated", request: false }));
  it("refreshes the request scope when the selected card changes", () => {
    const session = { authenticated: true, session: { role: "viewer", tenantId: "tenant-1" } } as const;
    const first = resolveTrustCenterRequestScope(session, "card-1");
    const second = resolveTrustCenterRequestScope(session, "card-2");
    expect(first.request && first.params.get("cardId")).toBe("card-1");
    expect(second.request && second.params.get("cardId")).toBe("card-2");
  });
});
