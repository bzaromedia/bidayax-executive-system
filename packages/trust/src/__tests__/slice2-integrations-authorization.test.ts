import { describe, expect, it } from "vitest";
import { authorizeTrustOperation, trustPermissions } from "../api-authorization";
import { createSanitizedEvidence } from "../integrations";

describe("sanitized slice-2 evidence integration", () => {
  const base = { attributes: { decision: "allowed", policyVersion: "1" }, cardId: "card-1", occurredAt: "2026-07-17T10:00:00.000Z", outcome: "recorded" as const, reasonCode: "POLICY_APPLIED", subjectId: "subject-hash", tenantId: "tenant-1" };
  it.each([
    ["identity", "identity.created"], ["identity", "identity.provider_linked"], ["identity", "identity.membership_changed"], ["identity", "identity.card_grant_changed"], ["identity", "identity.account_disabled"], ["identity", "identity.session_revoked"], ["identity", "identity.authorization_changed"], ["identity", "identity.security_webhook_result"],
    ["telephony", "telephony.command_accepted"], ["telephony", "telephony.command_denied"], ["telephony", "telephony.state_transition"], ["telephony", "telephony.routing_decision"], ["telephony", "telephony.provider_event_normalized"], ["telephony", "telephony.usage_recorded"], ["telephony", "telephony.safety_decision"],
    ["receptionist", "receptionist.consent"], ["receptionist", "receptionist.retention"], ["receptionist", "receptionist.redaction"], ["receptionist", "receptionist.safety"], ["receptionist", "receptionist.tool_authorization"], ["receptionist", "receptionist.escalation"], ["receptionist", "receptionist.language_policy"], ["receptionist", "receptionist.runtime_policy"]
  ] as const)("creates deterministic %s evidence for %s", (family, eventType) => {
    const first = createSanitizedEvidence({ ...base, eventType, family });
    expect(first.eventId).toMatch(/^evidence_[a-f0-9]{64}$/);
    expect(createSanitizedEvidence({ ...base, eventType, family }).eventId).toBe(first.eventId);
  });

  it.each(["rawAudio", "transcript", "accessToken", "authorizationHeader", "providerToken", "email", "phone", "privateKey", "secret"])("rejects unsafe attribute %s", (key) => {
    expect(() => createSanitizedEvidence({ ...base, attributes: { [key]: "unsafe" }, eventType: "telephony.safety_decision", family: "telephony" })).toThrow("Unsafe evidence");
  });
});

describe("deny-by-default trust authorization", () => {
  const input = { authenticatedTenantId: "tenant-1", cardId: "card-1", operation: "artifact-verification", permissions: ["trust.verify"], permittedCardIds: ["card-1"], privileged: false, resourceTenantId: "tenant-1" } as const;
  it("covers every required permission", () => expect(trustPermissions).toHaveLength(7));
  it("allows exact permission and boundaries", () => expect(authorizeTrustOperation(input)).toMatchObject({ allowed: true, permission: "trust.verify" }));
  it("allows privileged tenant administrators to request tenant-wide status", () => {
    expect(authorizeTrustOperation({ ...input, cardId: null, operation: "trust-status", permissions: ["trust.verify"], permittedCardIds: [], privileged: true })).toMatchObject({ allowed: true, permission: "trust.verify" });
  });
  it.each(["executive", "viewer"])("allows %s users with trust permission and an authorized card", () => {
    expect(authorizeTrustOperation({ ...input, cardId: "card-1", operation: "trust-status", permissions: ["trust.verify"], permittedCardIds: ["card-1"], privileged: false })).toMatchObject({ allowed: true, permission: "trust.verify" });
  });
  it.each([
    [{ ...input, operation: "unknown" }, "unknown_operation"],
    [{ ...input, resourceTenantId: "tenant-2" }, "tenant_mismatch"],
    [{ ...input, cardId: "card-2" }, "card_access_denied"],
    [{ ...input, cardId: null }, "card_access_denied"],
    [{ ...input, permissions: [] }, "permission_denied"]
  ] as const)("denies invalid requests", (value, code) => expect(authorizeTrustOperation(value)).toEqual({ allowed: false, code }));
});
