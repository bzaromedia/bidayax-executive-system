import {
  canTransitionCommunicationLifecycleState,
  type CommunicationLifecycleState
} from "../state-machines";
import type { CommunicationChannel } from "../types";

export const communicationsDataModelVersion = "phase-11b.v1" as const;

export const communicationDataModelTables = [
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
] as const;

export type CommunicationDataModelTable =
  (typeof communicationDataModelTables)[number];

export const telephonyTableOwnershipDecisions = [
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
] as const;

export type TelephonyTableOwnershipDecision =
  (typeof telephonyTableOwnershipDecisions)[number];

export const communicationDataClassifications = [
  "public_safe_metadata",
  "internal_operational_metadata",
  "sensitive_communications_metadata",
  "consent_legal_evidence",
  "audit_evidence",
  "trust_evidence",
  "prohibited_raw_sensitive_material"
] as const;

export type CommunicationDataClassification =
  (typeof communicationDataClassifications)[number];

export const communicationConsentPurposes = [
  "callback",
  "scheduling",
  "support",
  "relationship_follow_up",
  "emergency_escalation"
] as const;

export type CommunicationConsentPurpose =
  (typeof communicationConsentPurposes)[number];

export const communicationTrustEvidenceDomains = [
  "communications.lifecycle",
  "communications.consent",
  "communications.suppression",
  "communications.routing",
  "communications.audit",
  "communications.webhook"
] as const;

export type CommunicationTrustEvidenceDomain =
  (typeof communicationTrustEvidenceDomains)[number];

export const communicationTrustEvidenceAllowedFields = [
  "tenantId",
  "cardId",
  "communicationId",
  "channel",
  "eventType",
  "reasonCode",
  "occurredAt",
  "policyVersion",
  "consentReceiptId",
  "suppressionId",
  "routingPolicyId",
  "adapterId",
  "providerEventId",
  "payloadHash"
] as const;

export type CommunicationTrustEvidenceAllowedField =
  (typeof communicationTrustEvidenceAllowedFields)[number];

export const sensitiveCommunicationMetadataPattern =
  /(authorization|bearer|token|secret|password|private[ _-]?key|raw[_ -]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email|@)/i;

export type SafeCommunicationMetadataValue = string | number | boolean | null;

export type SafeCommunicationMetadata = Readonly<
  Record<string, SafeCommunicationMetadataValue>
>;

export type CommunicationEndpointDraft = {
  readonly endpointId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly participantId: string;
  readonly channel: CommunicationChannel;
  readonly endpointValueHash: string;
  readonly normalizedHint: string | null;
  readonly verificationState:
    | "unverified"
    | "verified"
    | "revoked"
    | "suppressed";
};

export type CommunicationCommandIdempotencyDraft = {
  readonly tenantId: string;
  readonly cardId: string;
  readonly operation: string;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly actorUserId: string;
  readonly sessionId: string | null;
  readonly cardGrantId: string | null;
  readonly permissionVersion: string;
  readonly policyVersion: string;
};

export type CommunicationDispatchAttemptDraft = {
  readonly attemptId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string;
  readonly participantId: string;
  readonly purpose: CommunicationConsentPurpose;
  readonly consentReceiptId: string | null;
  readonly suppressionId: string | null;
  readonly commandOperation: string;
  readonly commandIdempotencyKey: string;
  readonly adapterId: string;
  readonly channel: CommunicationChannel;
  readonly state: "queued" | "blocked" | "failed" | "cancelled";
  readonly retryCount: number;
  readonly providerDispatchEnabled: false;
  readonly providerReferenceId: string | null;
  readonly failureReasonCode: string | null;
};

export type CommunicationTrustEvidenceReferenceDraft = {
  readonly referenceId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string;
  readonly domain: CommunicationTrustEvidenceDomain;
  readonly artifactSchema: string;
  readonly canonicalizationVersion: "bidayax-c14n-1";
  readonly keyPurpose:
    | "audit_chain_signing"
    | "agent_message_signing"
    | "capital_document_signing"
    | "provenance_signing"
    | "settings_signing"
    | "verification_only";
  readonly evidenceFields: SafeCommunicationMetadata;
};

function assertNonEmpty(label: string, value: string) {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty.`);
  }
}

export function assertSafeCommunicationMetadata(
  metadata: SafeCommunicationMetadata
) {
  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveCommunicationMetadataPattern.test(key)) {
      throw new Error(`Communication metadata key '${key}' is not safe.`);
    }

    if (
      typeof value === "string" &&
      sensitiveCommunicationMetadataPattern.test(value)
    ) {
      throw new Error(`Communication metadata value for '${key}' is not safe.`);
    }
  }
}

export function assertCommunicationEndpointDraft(
  draft: CommunicationEndpointDraft
) {
  assertNonEmpty("endpointId", draft.endpointId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("participantId", draft.participantId);

  if (!/^[0-9a-f]{64}$/.test(draft.endpointValueHash)) {
    throw new Error("endpointValueHash must be a SHA-256 hex digest.");
  }

  if (
    draft.normalizedHint &&
    sensitiveCommunicationMetadataPattern.test(draft.normalizedHint)
  ) {
    throw new Error("normalizedHint must not contain raw endpoint data.");
  }
}

export function assertCommunicationCommandIdempotencyDraft(
  draft: CommunicationCommandIdempotencyDraft
) {
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("cardId", draft.cardId);
  assertNonEmpty("operation", draft.operation);
  assertNonEmpty("idempotencyKey", draft.idempotencyKey);
  assertNonEmpty("actorUserId", draft.actorUserId);
  if (draft.sessionId !== null) {
    assertNonEmpty("sessionId", draft.sessionId);
  }
  if (draft.cardGrantId !== null) {
    assertNonEmpty("cardGrantId", draft.cardGrantId);
  }
  assertNonEmpty("permissionVersion", draft.permissionVersion);
  assertNonEmpty("policyVersion", draft.policyVersion);

  if (!/^[0-9a-f]{64}$/.test(draft.requestHash)) {
    throw new Error("requestHash must be a SHA-256 hex digest.");
  }
}

export function assertCommunicationDispatchAttemptDraft(
  draft: CommunicationDispatchAttemptDraft
) {
  assertNonEmpty("attemptId", draft.attemptId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("communicationId", draft.communicationId);
  assertNonEmpty("participantId", draft.participantId);
  assertNonEmpty("commandOperation", draft.commandOperation);
  assertNonEmpty("commandIdempotencyKey", draft.commandIdempotencyKey);
  assertNonEmpty("adapterId", draft.adapterId);

  if (draft.retryCount < 0 || !Number.isInteger(draft.retryCount)) {
    throw new Error("retryCount must be a non-negative integer.");
  }

  if (draft.providerDispatchEnabled !== false) {
    throw new Error("provider dispatch must remain disabled.");
  }

  if (draft.state === "queued" && !draft.consentReceiptId) {
    throw new Error("queued dispatch attempts require cited consent evidence.");
  }

  if (
    draft.providerReferenceId &&
    sensitiveCommunicationMetadataPattern.test(draft.providerReferenceId)
  ) {
    throw new Error("providerReferenceId must not contain sensitive data.");
  }
}

export function assertCommunicationTrustEvidenceReferenceDraft(
  draft: CommunicationTrustEvidenceReferenceDraft
) {
  assertNonEmpty("referenceId", draft.referenceId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("communicationId", draft.communicationId);
  assertNonEmpty("artifactSchema", draft.artifactSchema);
  assertSafeCommunicationMetadata(draft.evidenceFields);

  const allowedFields = new Set<string>(communicationTrustEvidenceAllowedFields);
  for (const key of Object.keys(draft.evidenceFields)) {
    if (!allowedFields.has(key)) {
      throw new Error(
        `Communication trust evidence field '${key}' is not allowlisted.`
      );
    }
  }
}

export function assertCommunicationLifecycleTransition(input: {
  readonly from: CommunicationLifecycleState;
  readonly to: CommunicationLifecycleState;
}) {
  if (!canTransitionCommunicationLifecycleState(input)) {
    throw new Error(
      `Invalid communication lifecycle transition from ${input.from} to ${input.to}.`
    );
  }
}
