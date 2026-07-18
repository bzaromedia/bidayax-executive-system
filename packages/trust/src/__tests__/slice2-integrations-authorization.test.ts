import { describe, expect, it } from "vitest";
import { authorizeTrustOperation, trustPermissions } from "../api-authorization";
import { createSanitizedEvidence } from "../integrations";
import { validateSafeEvidenceAttributes } from "../validation";
import type { SafeMetadata } from "../types";

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

  it.each(["rawAudio", "transcript", "accessToken", "authorizationHeader", "providerToken", "email", "phone", "privateKey", "secret"])("rejects unsafe top-level attribute %s", (key) => {
    expect(() => createSanitizedEvidence({ ...base, attributes: { [key]: "unsafe" }, eventType: "telephony.safety_decision", family: "telephony" })).toThrow(/unsafe evidence/);
  });

  it.each([
    "raw_audio", "raw-audio", "RawAudio", "rawAudio", "RAW AUDIO", "messageBody", "full-message-body", "Prompt", "response", "session token"
  ])("rejects normalized unsafe attribute key %s at every depth", (key) => {
    const attributes = { audit: [{ decision: "denied", nested: { [key]: "sensitive-value" } }] } as unknown as SafeMetadata;
    expect(() => createSanitizedEvidence({ ...base, attributes, eventType: "receptionist.safety", family: "receptionist" })).toThrow(/unsafe evidence attribute key/);
    try {
      createSanitizedEvidence({ ...base, attributes, eventType: "receptionist.safety", family: "receptionist" });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain("sensitive-value");
    }
  });

  it("preserves safe nested consent, retention, redaction, and authorization metadata", () => {
    const attributes = {
      authorizationDecision: "allowed",
      consentStatus: "granted",
      contentDigest: "a".repeat(64),
      nested: { policyVersion: "1", reasonCode: "CONSENT_CONFIRMED", redactionStatus: "redacted" },
      retention: [{ decision: "retain", timestamp: "2026-07-17T10:00:00.000Z" }],
      safeArtifactReference: "ref:artifact-1"
    } as const satisfies SafeMetadata;
    expect(createSanitizedEvidence({ ...base, attributes, eventType: "receptionist.tool_authorization", family: "receptionist" }).attributes).toBe(attributes);
  });

  it("fails closed on evidence traversal and size limits", () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: "too-deep" } } } } } } };
    expect(validateSafeEvidenceAttributes(deep, { maxArrayLength: 10, maxDepth: 3, maxObjectKeys: 10, maxSerializedSize: 1_000, maxStringLength: 50 }).errors).toContain("unsafe evidence attribute depth at attributes.a.b.c.d");
    expect(validateSafeEvidenceAttributes({ values: [1, 2, 3] }, { maxArrayLength: 2, maxDepth: 6, maxObjectKeys: 10, maxSerializedSize: 1_000, maxStringLength: 50 }).errors).toContain("unsafe evidence array length at attributes.values");
    expect(validateSafeEvidenceAttributes(Object.fromEntries(Array.from({ length: 4 }, (_, index) => [`k${index}`, index])), { maxArrayLength: 10, maxDepth: 6, maxObjectKeys: 3, maxSerializedSize: 1_000, maxStringLength: 50 }).errors).toContain("unsafe evidence object key count at attributes");
    expect(validateSafeEvidenceAttributes({ reasonCode: "x".repeat(51) }, { maxArrayLength: 10, maxDepth: 6, maxObjectKeys: 10, maxSerializedSize: 1_000, maxStringLength: 50 }).errors).toContain("unsafe evidence string length at attributes.reasonCode");
    expect(validateSafeEvidenceAttributes({ safeReference: "x".repeat(80) }, { maxArrayLength: 10, maxDepth: 6, maxObjectKeys: 10, maxSerializedSize: 30, maxStringLength: 100 }).errors).toContain("evidence attributes are not canonicalizable or exceed the serialized size limit");
  });

  it("rejects cyclic evidence and does not mutate valid input", () => {
    const cyclic: Record<string, unknown> = { decision: "allowed" };
    cyclic.self = cyclic;
    const cyclicResult = validateSafeEvidenceAttributes(cyclic);
    expect(cyclicResult.valid).toBe(false);
    expect(cyclicResult.errors.join(";")).toMatch(/cycle/);
    const input = { nested: { policyVersion: "1" }, outcome: "accepted" } as const;
    const before = JSON.stringify(input);
    expect(validateSafeEvidenceAttributes(input).valid).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
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
