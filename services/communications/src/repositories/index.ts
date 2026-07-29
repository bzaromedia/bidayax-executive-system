import type {
  CommunicationAuditEventDraft,
  CommunicationAuditEventDataModelDraft,
  CommunicationCommandIdempotencyDraft,
  CommunicationCommandResultDraft,
  CommunicationDispatchAttemptDraft,
  CommunicationEndpointDraft,
  CommunicationEventEnvelope,
  CommunicationLifecycleTransitionDraft,
  CommunicationTrustEvidenceReferenceDraft,
  CommunicationTrustEvidenceDraft,
  ProviderNeutralWebhookEvidenceDraft
} from "@bidayax/communications-domain";

export interface CommunicationLifecycleRepository {
  appendEvent(event: CommunicationEventEnvelope): Promise<void>;
  loadLatestState(input: {
    readonly tenantId: string;
    readonly communicationId: string;
  }): Promise<CommunicationEventEnvelope | null>;
}

export interface CommunicationAuditRepository {
  writeAuditEvent(event: CommunicationAuditEventDraft): Promise<void>;
}

export interface CommunicationTrustRepository {
  writeTrustEvidence(evidence: CommunicationTrustEvidenceDraft): Promise<void>;
}

export interface CommunicationWebhookEvidenceRepository {
  recordWebhookEvidence(
    evidence: ProviderNeutralWebhookEvidenceDraft
  ): Promise<void>;
}

export interface CommunicationDataModelRepository {
  reserveCommandIdempotency(
    command: CommunicationCommandIdempotencyDraft
  ): Promise<"reserved" | "replayed" | "conflict">;
  completeCommandIdempotency(
    result: CommunicationCommandResultDraft
  ): Promise<"completed" | "failed" | "replayed">;
  upsertParticipantEndpoint(endpoint: CommunicationEndpointDraft): Promise<void>;
  appendLifecycleTransition(
    transition: CommunicationLifecycleTransitionDraft
  ): Promise<void>;
  recordDispatchAttempt(attempt: CommunicationDispatchAttemptDraft): Promise<void>;
  linkTrustEvidence(
    reference: CommunicationTrustEvidenceReferenceDraft
  ): Promise<void>;
  appendAuditEvent(event: CommunicationAuditEventDataModelDraft): Promise<void>;
}
