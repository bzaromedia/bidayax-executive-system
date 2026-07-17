import { describe, expect, it } from "vitest";
import { deriveTrustCenterState, type TrustCenterSnapshot } from "./trust-center-state";
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
