import {
  canTransitionCommunicationLifecycleState,
  type CommunicationLifecycleState
} from "../state-machines";
import {
  communicationCommandTypes,
  type CommunicationCommandType
} from "../commands";
import type { CommunicationChannel } from "../types";

export const communicationsDataModelVersion = "phase-11b.v1" as const;
export const communicationPermissionVersion = "communications-permissions-v1" as const;
export const communicationPolicyVersion = "communications-policy-v1" as const;

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
  "communication_business_hours_policies",
  "communication_receptionist_sessions",
  "communication_adapter_health",
  "communication_summaries",
  "communication_failover_events",
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
  "consentPolicyId",
  "consentReceiptId",
  "participantId",
  "purpose",
  "status",
  "source",
  "observedAt",
  "effectiveAt",
  "expiresAt",
  "revokedAt",
  "envelopeId",
  "suppressionId",
  "routingPolicyId",
  "adapterId",
  "providerEventId",
  "payloadHash"
] as const;

export type CommunicationTrustEvidenceAllowedField =
  (typeof communicationTrustEvidenceAllowedFields)[number];

export const sensitiveCommunicationMetadataPattern =
  /(authorization|bearer|token|secret|password|private[ _-]?key|raw[_ -]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email|@|\+?[0-9][0-9 .()]{6,}[0-9]|\([0-9]{3}\)[0-9 ._-]{3,}[0-9]|(\+?1[- .]?)?\(?[2-9][0-9]{2}\)?[- .][0-9]{3}[- .][0-9]{4}|[0-9]{10,})/i;

export type SafeCommunicationMetadataValue = string | number | boolean | null;

export type SafeCommunicationMetadata = Readonly<
  Record<string, SafeCommunicationMetadataValue>
>;

const communicationMetadataDigestFields = new Set([
  "requestHash",
  "payloadHash",
  "digest",
  "checksumSha256"
]);

const sha256HexDigestPattern = /^[0-9a-f]{64}$/;

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
  readonly cardId: string | null;
  readonly scopeType: "card" | "tenant" | "platform";
  readonly scopeId: string;
  readonly operation: CommunicationCommandType;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly actorType: "user" | "service" | "platform";
  readonly actorUserId: string | null;
  readonly actorServiceId: string | null;
  readonly actorPlatformId: string | null;
  readonly sessionId: string | null;
  readonly cardGrantId: string | null;
  readonly authorizationDecisionId: string;
  readonly permissionVersion: string;
  readonly requiredPermission: string;
  readonly policyVersion: string;
};

export type CommunicationCommandResultDraft = {
  readonly tenantId: string;
  readonly scopeType: "card" | "tenant" | "platform";
  readonly scopeId: string;
  readonly operation: CommunicationCommandType;
  readonly idempotencyKey: string;
  readonly status: "completed" | "failed";
  readonly resultCommunicationId: string | null;
  readonly completedAt: string;
};

export type CommunicationLifecycleTransitionDraft = {
  readonly transitionId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string;
  readonly sequenceNumber: number;
  readonly fromState: CommunicationLifecycleState;
  readonly toState: CommunicationLifecycleState;
  readonly reasonCode: string;
  readonly actorUserId: string | null;
  readonly authorizationDecisionId: string;
  readonly occurredAt: string;
  readonly metadata: SafeCommunicationMetadata;
};

export type CommunicationAuditEventDataModelDraft = {
  readonly auditEventId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
  readonly eventType: string;
  readonly actorType: "user" | "service" | "platform" | "system";
  readonly actorUserId: string | null;
  readonly actorServiceId: string | null;
  readonly actorPlatformId: string | null;
  readonly authorizationDecisionId: string;
  readonly permissionVersion: string;
  readonly policyVersion: string;
  readonly result: "succeeded" | "failed" | "denied" | "blocked";
  readonly reasonCode: string;
  readonly occurredAt: string;
  readonly metadata: SafeCommunicationMetadata;
};

export type CommunicationDispatchAttemptDraft = {
  readonly attemptId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly communicationId: string;
  readonly participantId: string;
  readonly purpose: CommunicationConsentPurpose;
  readonly consentReceiptId: string | null;
  readonly suppressionId: string | null;
  readonly commandOperation: CommunicationCommandType;
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
  readonly keyPurpose: "tenant_artifact_signing";
  readonly envelopeId: string;
  readonly trustEventId: string;
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
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new Error("Communication metadata must be a safe JSON object.");
  }

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

    if (
      communicationMetadataDigestFields.has(key) &&
      (typeof value !== "string" || !sha256HexDigestPattern.test(value))
    ) {
      throw new Error(
        `Communication metadata value for '${key}' must be a SHA-256 hex digest.`
      );
    }

    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw new Error(
        `Communication metadata value for '${key}' must be a primitive safe value.`
      );
    }
  }
}

export function assertCommunicationEndpointDraft(
  draft: CommunicationEndpointDraft
) {
  assertNonEmpty("endpointId", draft.endpointId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("participantId", draft.participantId);

  if (!sha256HexDigestPattern.test(draft.endpointValueHash)) {
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
  assertNonEmpty("scopeId", draft.scopeId);
  assertNonEmpty("operation", draft.operation);
  if (!(communicationCommandTypes as readonly string[]).includes(draft.operation)) {
    throw new Error("communication command operation is not registered.");
  }
  assertNonEmpty("idempotencyKey", draft.idempotencyKey);
  if (draft.scopeType === "card") {
    if (!draft.cardId || draft.scopeId !== draft.cardId) {
      throw new Error("card-scoped communication commands require card scope.");
    }
  } else if (draft.scopeType === "tenant") {
    if (draft.cardId !== null || draft.scopeId !== draft.tenantId) {
      throw new Error("tenant-scoped communication commands must be cardless.");
    }
  } else if (draft.cardId !== null || draft.scopeId !== "platform") {
    throw new Error("platform-scoped communication commands must be cardless.");
  }

  if (
    draft.operation !== "apply_tenant_kill_switch" &&
    draft.operation !== "apply_platform_kill_switch" &&
    draft.scopeType !== "card"
  ) {
    throw new Error("non-kill-switch communication commands require card scope.");
  }

  if (draft.actorType === "user") {
    if (!draft.actorUserId || !draft.sessionId) {
      throw new Error("user communication commands require actor and session.");
    }
    if (draft.scopeType === "card" && !draft.cardGrantId) {
      throw new Error("card-scoped user commands require a card grant.");
    }
    if (draft.actorServiceId !== null || draft.actorPlatformId !== null) {
      throw new Error("user commands cannot carry service or platform actors.");
    }
  } else if (draft.actorType === "service") {
    if (
      !draft.actorServiceId ||
      draft.actorUserId !== null ||
      draft.actorPlatformId !== null ||
      draft.sessionId !== null ||
      draft.cardGrantId !== null
    ) {
      throw new Error("service commands require only a service actor.");
    }
  } else if (
    !draft.actorPlatformId ||
    draft.actorUserId !== null ||
    draft.actorServiceId !== null ||
    draft.sessionId !== null ||
    draft.cardGrantId !== null
  ) {
    throw new Error("platform commands require only a platform actor.");
  }
  assertNonEmpty("authorizationDecisionId", draft.authorizationDecisionId);
  assertNonEmpty("requiredPermission", draft.requiredPermission);
  if (draft.permissionVersion !== communicationPermissionVersion) {
    throw new Error(`permissionVersion must be ${communicationPermissionVersion}.`);
  }
  if (draft.policyVersion !== communicationPolicyVersion) {
    throw new Error(`policyVersion must be ${communicationPolicyVersion}.`);
  }

  if (draft.operation === "apply_platform_kill_switch") {
    if (
      draft.actorType !== "platform" ||
      draft.scopeType !== "platform" ||
      draft.requiredPermission !== "communications:platform:kill_switch"
    ) {
      throw new Error("platform kill-switch commands require platform actor and scope.");
    }
  } else if (draft.operation === "apply_tenant_kill_switch") {
    if (
      (draft.actorType !== "user" && draft.actorType !== "service") ||
      draft.scopeType !== "tenant" ||
      draft.requiredPermission !== "communications:tenant:kill_switch"
    ) {
      throw new Error("tenant kill-switch commands require tenant actor and scope.");
    }
  } else if (
    draft.actorType !== "user" ||
    draft.scopeType !== "card" ||
    draft.requiredPermission !== `communications:${draft.operation}`
  ) {
    throw new Error("card communication commands require user actor and operation permission.");
  }

  if (!sha256HexDigestPattern.test(draft.requestHash)) {
    throw new Error("requestHash must be a SHA-256 hex digest.");
  }
}

export function assertCommunicationCommandResultDraft(
  draft: CommunicationCommandResultDraft
) {
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("scopeId", draft.scopeId);
  assertNonEmpty("operation", draft.operation);
  if (!(communicationCommandTypes as readonly string[]).includes(draft.operation)) {
    throw new Error("communication command result operation is not registered.");
  }
  assertNonEmpty("idempotencyKey", draft.idempotencyKey);
  assertNonEmpty("completedAt", draft.completedAt);

  const communicationProducingOperations = new Set<CommunicationCommandType>([
    "request_callback",
    "cancel_callback",
    "schedule_communication",
    "initiate_communication",
    "accept_inbound_communication_event",
    "escalate_to_human",
    "terminate_communication"
  ]);

  if (
    draft.status === "completed" &&
    communicationProducingOperations.has(draft.operation) &&
    !draft.resultCommunicationId
  ) {
    throw new Error(
      "completed communication-producing command results require a result communication id."
    );
  }

  if (
    draft.status === "completed" &&
    !communicationProducingOperations.has(draft.operation) &&
    draft.resultCommunicationId !== null
  ) {
    throw new Error(
      "completed non-communication command results cannot carry a result communication id."
    );
  }

  if (draft.status === "failed" && draft.resultCommunicationId !== null) {
    throw new Error("failed communication command results cannot carry a result communication id.");
  }
}

export function assertCommunicationLifecycleTransitionDraft(
  draft: CommunicationLifecycleTransitionDraft
) {
  assertNonEmpty("transitionId", draft.transitionId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("communicationId", draft.communicationId);
  assertNonEmpty("reasonCode", draft.reasonCode);
  assertNonEmpty("authorizationDecisionId", draft.authorizationDecisionId);

  if (!Number.isInteger(draft.sequenceNumber) || draft.sequenceNumber < 1) {
    throw new Error("sequenceNumber must be a positive integer.");
  }

  assertCommunicationLifecycleTransition({
    from: draft.fromState,
    to: draft.toState
  });
  assertSafeCommunicationMetadata(draft.metadata);
}

export function assertCommunicationAuditEventDataModelDraft(
  draft: CommunicationAuditEventDataModelDraft
) {
  assertNonEmpty("auditEventId", draft.auditEventId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("eventType", draft.eventType);
  assertNonEmpty("authorizationDecisionId", draft.authorizationDecisionId);
  if (draft.permissionVersion !== communicationPermissionVersion) {
    throw new Error(`permissionVersion must be ${communicationPermissionVersion}.`);
  }
  if (draft.policyVersion !== communicationPolicyVersion) {
    throw new Error(`policyVersion must be ${communicationPolicyVersion}.`);
  }
  assertNonEmpty("reasonCode", draft.reasonCode);

  if (
    draft.actorType === "user" &&
    (!draft.actorUserId ||
      draft.actorServiceId !== null ||
      draft.actorPlatformId !== null)
  ) {
    throw new Error("user audit events require only a user actor.");
  }
  if (
    draft.actorType === "service" &&
    (!draft.actorServiceId ||
      draft.actorUserId !== null ||
      draft.actorPlatformId !== null)
  ) {
    throw new Error("service audit events require only a service actor.");
  }
  if (
    (draft.actorType === "platform" || draft.actorType === "system") &&
    (!draft.actorPlatformId ||
      draft.actorUserId !== null ||
      draft.actorServiceId !== null)
  ) {
    throw new Error("platform and system audit events require only a platform actor.");
  }
  assertSafeCommunicationMetadata(draft.metadata);
}

export function assertCommunicationDispatchAttemptDraft(
  draft: CommunicationDispatchAttemptDraft
) {
  assertNonEmpty("attemptId", draft.attemptId);
  assertNonEmpty("tenantId", draft.tenantId);
  assertNonEmpty("communicationId", draft.communicationId);
  assertNonEmpty("participantId", draft.participantId);
  assertNonEmpty("cardId", draft.cardId);
  assertNonEmpty("commandOperation", draft.commandOperation);
  if (!(communicationCommandTypes as readonly string[]).includes(draft.commandOperation)) {
    throw new Error("dispatch command operation is not registered.");
  }
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
  assertNonEmpty("envelopeId", draft.envelopeId);
  assertNonEmpty("trustEventId", draft.trustEventId);
  if (
    (draft.domain === "communications.lifecycle" &&
      draft.artifactSchema !== "communication-lifecycle-v1") ||
    (draft.domain === "communications.consent" &&
      draft.artifactSchema !== "communication-consent-v1") ||
    (draft.domain === "communications.suppression" &&
      draft.artifactSchema !== "communication-suppression-v1") ||
    (draft.domain === "communications.routing" &&
      draft.artifactSchema !== "communication-routing-v1") ||
    (draft.domain === "communications.audit" &&
      draft.artifactSchema !== "communication-audit-v1") ||
    (draft.domain === "communications.webhook" &&
      draft.artifactSchema !== "communication-webhook-evidence-v1")
  ) {
    throw new Error("communication trust domain and artifact schema are incompatible.");
  }
  if (draft.keyPurpose !== "tenant_artifact_signing") {
    throw new Error("communication trust references require tenant artifact signing.");
  }
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
