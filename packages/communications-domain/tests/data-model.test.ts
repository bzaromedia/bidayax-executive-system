import { describe, expect, it } from "vitest";
import {
  assertCommunicationCommandIdempotencyDraft,
  assertCommunicationDispatchAttemptDraft,
  assertCommunicationEndpointDraft,
  assertCommunicationLifecycleTransition,
  assertCommunicationTrustEvidenceReferenceDraft,
  assertSafeCommunicationMetadata,
  communicationDataModelTables,
  communicationTrustEvidenceAllowedFields,
  telephonyTableOwnershipDecisions
} from "../src/data-model";

const digest =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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
      "communication_receptionist_sessions",
      "communication_adapter_health",
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
        route: "blocked"
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
    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        requestHash: digest,
        actorUserId: "user-1",
        sessionId: "session-1",
        cardGrantId: "grant-1",
        permissionVersion: "permissions-v1",
        policyVersion: "policy-v1"
      })
    ).not.toThrow();

    expect(() =>
      assertCommunicationCommandIdempotencyDraft({
        tenantId: "tenant-1",
        cardId: "card-1",
        operation: "request_callback",
        idempotencyKey: "request-1",
        requestHash: "not-a-digest",
        actorUserId: "user-1",
        sessionId: "session-1",
        cardGrantId: "grant-1",
        permissionVersion: "permissions-v1",
        policyVersion: "policy-v1"
      })
    ).toThrow(/SHA-256/);
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
        keyPurpose: "verification_only",
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
        keyPurpose: "verification_only",
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
        keyPurpose: "verification_only",
        evidenceFields: {
          safeButUnexpected: "value"
        }
      })
    ).toThrow(/allowlisted/);

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
