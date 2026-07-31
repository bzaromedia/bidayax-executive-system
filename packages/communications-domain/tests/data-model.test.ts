import { describe, expect, it } from "vitest";
import { communicationCommandTypes } from "../src/commands";
import {
  assertCommunicationCommandIdempotencyDraft,
  assertCommunicationCommandResultDraft,
  assertCommunicationDispatchAttemptDraft,
  assertCommunicationEndpointDraft,
  assertCommunicationAuditEventDataModelDraft,
  assertCommunicationLifecycleTransitionDraft,
  assertCommunicationLifecycleTransition,
  assertCommunicationTrustEvidenceReferenceDraft,
  assertSafeCommunicationMetadata,
  communicationPermissionVersion,
  communicationPolicyVersion,
  communicationDataModelTables,
  communicationTrustEvidenceAllowedFields,
  telephonyTableOwnershipDecisions
} from "../src/data-model";
import type { SafeCommunicationMetadata } from "../src/data-model";

const digest =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const commandVersions = {
  permissionVersion: communicationPermissionVersion,
  policyVersion: communicationPolicyVersion
} as const;

function cardCommandDraft(
  operation: (typeof communicationCommandTypes)[number],
  overrides: Partial<Parameters<typeof assertCommunicationCommandIdempotencyDraft>[0]> = {}
) {
  return {
    tenantId: "tenant-1",
    cardId: "card-1",
    scopeType: "card" as const,
    scopeId: "card-1",
    operation,
    idempotencyKey: `request-${operation}`,
    requestHash: digest,
    actorType: "user" as const,
    actorUserId: "user-1",
    actorServiceId: null,
    actorPlatformId: null,
    sessionId: "session-1",
    cardGrantId: "grant-1",
    authorizationDecisionId: `authz-${operation}`,
    requiredPermission: `communications:${operation}`,
    ...commandVersions,
    ...overrides
  };
}

describe("communications data model contract", () => {
  it("declares the complete Phase 11B communications-owned table set", () => {
    expect(communicationDataModelTables).toEqual([
      "communications",
      "communication_participants",
      "communication_participant_endpoints",
      "communication_consent_policies",
      "communication_consent_receipts",
      "communication_suppressions",
      "communication_lifecycle_transitions",
      "communication_command_idempotency_keys",
      "communication_dispatch_attempts",
      "communication_webhook_evidence",
      "communication_routing_policies",
      "communication_business_hours_policies",
      "communication_receptionist_sessions",
      "communication_adapter_health",
      "communication_summaries",
      "communication_failover_events",
      "communication_trust_evidence_references",
      "communication_audit_events"
    ]);
  });

  it("records an ownership decision for every legacy telephony table", () => {
    expect(telephonyTableOwnershipDecisions).toEqual([
      "telephony_calls",
      "telephony_call_events",
      "voice_sessions",
      "outbound_call_requests",
      "telephony_phone_numbers",
      "telephony_call_sessions",
      "telephony_call_queues",
      "telephony_callback_requests",
      "telephony_appointment_requests",
      "telephony_call_transcripts",
      "telephony_voice_profiles",
      "telephony_call_recordings",
      "telephony_voicemails",
      "telephony_routing_rules",
      "telephony_escalation_policies",
      "telephony_consent_policies",
      "telephony_emergency_policy_signals",
      "telephony_command_idempotency_keys",
      "telephony_usage_ledger",
      "telephony_audit_events"
    ]);
  });

  it("rejects raw sensitive fields from safe metadata", () => {
    expect(() =>
      assertSafeCommunicationMetadata({
        reasonCode: "CONSENT_MISSING",
        route: "blocked",
        occurredAt: "2026-07-25T00:00:00.000Z"
      })
    ).not.toThrow();

    expect(() =>
      assertSafeCommunicationMetadata({
        authorizationHeader: "Bearer abc"
      })
    ).toThrow(/not safe/);
    expect(() =>
      assertSafeCommunicationMetadata({
        evidence: "caller@example.test"
      })
    ).toThrow(/not safe/);
    expect(() =>
      assertSafeCommunicationMetadata({
        hint: "+15555550123"
      })
    ).toThrow(/not safe/);
    expect(() =>
      assertSafeCommunicationMetadata({
        hint: "15555550123"
      })
    ).toThrow(/not safe/);
    expect(() =>
      assertSafeCommunicationMetadata({
        hint: "(555) 555-0123"
      })
    ).toThrow(/not safe/);
    for (const field of [
      "requestHash",
      "payloadHash",
      "digest",
      "checksumSha256"
    ]) {
      for (const invalidValue of [
        null,
        42,
        true,
        {},
        ["SAFE_VALUE"],
        "",
        "not-a-sha256-digest",
        digest.toUpperCase()
      ]) {
        expect(() =>
          assertSafeCommunicationMetadata({
            [field]: invalidValue
          } as unknown as SafeCommunicationMetadata)
        ).toThrow(/SHA-256 hex digest/);
      }
    }
    expect(() =>
      assertSafeCommunicationMetadata(
        "Bearer abc" as unknown as SafeCommunicationMetadata
      )
    ).toThrow(/safe JSON object/);
    expect(() =>
      assertSafeCommunicationMetadata(42 as unknown as SafeCommunicationMetadata)
    ).toThrow(/safe JSON object/);
    expect(() =>
      assertSafeCommunicationMetadata(true as unknown as SafeCommunicationMetadata)
    ).toThrow(/safe JSON object/);
    expect(() =>
      assertSafeCommunicationMetadata(null as unknown as SafeCommunicationMetadata)
    ).toThrow(/safe JSON object/);
    expect(() =>
      assertSafeCommunicationMetadata([
        "SAFE_VALUE"
      ] as unknown as SafeCommunicationMetadata)
    ).toThrow(/safe JSON object/);
    expect(() =>
      assertSafeCommunicationMetadata({
        wrapper: { email: "caller@example.test" }
      } as unknown as SafeCommunicationMetadata)
    ).toThrow(/primitive safe value/);
    expect(() =>
      assertSafeCommunicationMetadata({
        evidence: ["caller@example.test"]
      } as unknown as SafeCommunicationMetadata)
    ).toThrow(/primitive safe value/);
  });

  it("requires hashed endpoints instead of raw phone or email values", () => {
    expect(() =>
      assertCommunicationEndpointDraft({
        endpointId: "endpoint-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        participantId: "participant-1",
        channel: "telephony",
        endpointValueHash: digest,
        normalizedHint: "redacted-channel",
        verificationState: "verified"
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationEndpointDraft({
        endpointId: "endpoint-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        participantId: "participant-1",
        channel: "telephony",
        endpointValueHash: "+15555550123",
        normalizedHint: null,
        verificationState: "verified"
      })
    ).toThrow(/SHA-256/);
  });

  it("requires durable command idempotency inputs", () => {
    const cardScopedOperations = communicationCommandTypes.filter(
      (operation) =>
        operation !== "apply_tenant_kill_switch" &&
        operation !== "apply_platform_kill_switch"
    );

    for (const operation of cardScopedOperations) {
      expect(() =>
        assertCommunicationCommandIdempotencyDraft(cardCommandDraft(operation))
      ).not.toThrow();

      expect(() =>
        assertCommunicationCommandIdempotencyDraft(
          cardCommandDraft(operation, {
            actorType: "service",
            actorUserId: null,
            actorServiceId: "communications-service",
            sessionId: null,
            cardGrantId: null
          })
        )
      ).toThrow(/user actor and operation permission/);

      expect(() =>
        assertCommunicationCommandIdempotencyDraft(
          cardCommandDraft(operation, {
            requiredPermission: "communications:wrong_permission"
          })
        )
      ).toThrow(/operation permission/);
    }

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: "card-1",
        scopeType: "card",
        scopeId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        requestHash: digest,
        actorType: "user",
        actorUserId: "user-1",
        actorServiceId: null,
        actorPlatformId: null,
        sessionId: "session-1",
        cardGrantId: "grant-1",
        authorizationDecisionId: "authz-1",
        requiredPermission: "communications:request_callback",
        ...commandVersions
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        ...cardCommandDraft("request_callback"),
        permissionVersion: "permissions-v1",
        policyVersion: "policy-v1"
      })
    ).toThrow(/permissionVersion/);

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: "card-1",
        scopeType: "card",
        scopeId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        requestHash: "not-a-digest",
        actorType: "user",
        actorUserId: "user-1",
        actorServiceId: null,
        actorPlatformId: null,
        sessionId: "session-1",
        cardGrantId: "grant-1",
        authorizationDecisionId: "authz-1",
        requiredPermission: "communications:request_callback",
        ...commandVersions
      })
    ).toThrow(/SHA-256/);

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: null,
        scopeType: "platform",
        scopeId: "platform",
        operation: "apply_platform_kill_switch",
        idempotencyKey: "request-2",
        requestHash: digest,
        actorType: "platform",
        actorUserId: null,
        actorServiceId: null,
        actorPlatformId: "platform-admin",
        sessionId: null,
        cardGrantId: null,
        authorizationDecisionId: "authz-platform",
        requiredPermission: "communications:platform:kill_switch",
        ...commandVersions
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: null,
        scopeType: "tenant",
        scopeId: "tenant-1",
        operation: "apply_platform_kill_switch",
        idempotencyKey: "request-3",
        requestHash: digest,
        actorType: "platform",
        actorUserId: null,
        actorServiceId: null,
        actorPlatformId: "platform-admin",
        sessionId: null,
        cardGrantId: null,
        authorizationDecisionId: "authz-platform",
        requiredPermission: "communications:tenant:kill_switch",
        ...commandVersions
      })
    ).toThrow(/platform kill-switch/);

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: null,
        scopeType: "platform",
        scopeId: "platform",
        operation: "apply_platform_kill_switch",
        idempotencyKey: "request-user-platform",
        requestHash: digest,
        actorType: "user",
        actorUserId: "user-1",
        actorServiceId: null,
        actorPlatformId: null,
        sessionId: "session-1",
        cardGrantId: null,
        authorizationDecisionId: "authz-platform",
        requiredPermission: "communications:platform:kill_switch",
        ...commandVersions
      })
    ).toThrow(/platform actor/);

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: null,
        scopeType: "tenant",
        scopeId: "tenant-1",
        operation: "request_callback",
        idempotencyKey: "request-4",
        requestHash: digest,
        actorType: "user",
        actorUserId: "user-1",
        actorServiceId: null,
        actorPlatformId: null,
        sessionId: "session-1",
        cardGrantId: null,
        authorizationDecisionId: "authz-tenant",
        requiredPermission: "communications:request_callback",
        ...commandVersions
      })
    ).toThrow(/card scope/);

    expect(() =>
      assertCommunicationCommandResultDraft({
        tenantId: "tenant-1",
        scopeType: "card",
        scopeId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        status: "completed",
        resultCommunicationId: "communication-1",
        completedAt: "2026-07-25T00:00:00.000Z"
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationCommandResultDraft({
        tenantId: "tenant-1",
        scopeType: "card",
        scopeId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        status: "completed",
        resultCommunicationId: null,
        completedAt: "2026-07-25T00:00:00.000Z"
      })
    ).toThrow(/result communication id/);

    expect(() =>
      assertCommunicationCommandResultDraft({
        tenantId: "tenant-1",
        scopeType: "card",
        scopeId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        status: "failed",
        resultCommunicationId: "communication-1",
        completedAt: "2026-07-25T00:00:00.000Z"
      })
    ).toThrow(/cannot carry/);
  });

  it("requires persistence-complete lifecycle and audit drafts", () => {
    expect(() =>
      assertCommunicationLifecycleTransitionDraft({
        transitionId: "transition-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        sequenceNumber: 1,
        fromState: "requested",
        toState: "policy_checking",
        reasonCode: "CONSENT_CHECK_STARTED",
        actorUserId: "user-1",
        authorizationDecisionId: "authz-1",
        occurredAt: "2026-07-25T00:00:00.000Z",
        metadata: { reasonCode: "CONSENT_CHECK_STARTED" }
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationAuditEventDataModelDraft({
        auditEventId: "audit-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        eventType: "communication.denied",
        actorType: "user",
        actorUserId: null,
        actorServiceId: null,
        actorPlatformId: null,
        authorizationDecisionId: "authz-deny",
        result: "denied",
        reasonCode: "MISSING_CONSENT",
        occurredAt: "2026-07-25T00:00:00.000Z",
        metadata: {},
        ...commandVersions
      })
    ).toThrow(/user actor/);
  });

  it("keeps dispatch attempts disabled and consent-cited", () => {
    expect(() =>
      assertCommunicationDispatchAttemptDraft({
        attemptId: "attempt-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        participantId: "participant-1",
        purpose: "callback",
        consentReceiptId: "consent-1",
        suppressionId: null,
        commandOperation: "request_callback",
        commandIdempotencyKey: "request-1",
        adapterId: "telephony-disabled",
        channel: "telephony",
        state: "queued",
        retryCount: 0,
        providerDispatchEnabled: false,
        providerReferenceId: null,
        failureReasonCode: null
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationDispatchAttemptDraft({
        attemptId: "attempt-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        participantId: "participant-1",
        purpose: "callback",
        consentReceiptId: null,
        suppressionId: null,
        commandOperation: "request_callback",
        commandIdempotencyKey: "request-1",
        adapterId: "telephony-disabled",
        channel: "telephony",
        state: "queued",
        retryCount: 0,
        providerDispatchEnabled: false,
        providerReferenceId: null,
        failureReasonCode: null
      })
    ).toThrow(/consent/);
  });

  it("keeps trust evidence allowlisted and lifecycle transitions explicit", () => {
    expect(communicationTrustEvidenceAllowedFields).toContain("payloadHash");
    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.webhook",
        artifactSchema: "communication-webhook-evidence-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-1",
        trustEventId: "trust-event-1",
        evidenceFields: {
          payloadHash: digest,
          providerEventId: "provider-event-1"
        }
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.webhook",
        artifactSchema: "communication-webhook-evidence-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-1",
        trustEventId: "trust-event-1",
        evidenceFields: {
          rawPayload: "secret"
        }
      })
    ).toThrow(/not safe/);

    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.webhook",
        artifactSchema: "communication-webhook-evidence-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-1",
        trustEventId: "trust-event-1",
        evidenceFields: {
          payloadHash: "not-a-sha256-digest"
        }
      })
    ).toThrow(/SHA-256 hex digest/);

    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.webhook",
        artifactSchema: "communication-webhook-evidence-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-1",
        trustEventId: "trust-event-1",
        evidenceFields: {
          safeButUnexpected: "value"
        }
      })
    ).toThrow(/allowlisted/);

    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-1",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.webhook",
        artifactSchema: "communication-webhook-evidence-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-1",
        trustEventId: "",
        evidenceFields: {
          payloadHash: digest
        }
      })
    ).toThrow(/trustEventId/);

    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-consent",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.consent",
        artifactSchema: "communication-consent-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-consent-1",
        trustEventId: "trust-event-consent-1",
        evidenceFields: {
          channel: "telephony",
          consentPolicyId: "consent-policy-1",
          consentReceiptId: "consent-1",
          effectiveAt: "2026-07-25T10:00:00.000Z",
          envelopeId: "envelope-consent-1",
          expiresAt: null,
          observedAt: "2026-07-25T10:00:00.000Z",
          participantId: "participant-1",
          policyVersion: "communications-consent-v1",
          purpose: "callback",
          revokedAt: null,
          source: "visitor",
          status: "granted"
        }
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationTrustEvidenceReferenceDraft({
        referenceId: "trust-ref-consent",
        tenantId: "tenant-1",
        cardId: "card-1",
        communicationId: "communication-1",
        domain: "communications.consent",
        artifactSchema: "communication-webhook-evidence-v1",
        canonicalizationVersion: "bidayax-c14n-1",
        keyPurpose: "tenant_artifact_signing",
        envelopeId: "envelope-consent-1",
        trustEventId: "trust-event-consent-1",
        evidenceFields: {
          consentReceiptId: "consent-1"
        }
      })
    ).toThrow(/domain and artifact schema/);

    expect(() =>
      assertCommunicationLifecycleTransition({
        from: "requested",
        to: "policy_checking"
      })
    ).not.toThrow();
    expect(() =>
      assertCommunicationLifecycleTransition({
        from: "completed",
        to: "active"
      })
    ).toThrow(/Invalid communication lifecycle transition/);
  });
});
