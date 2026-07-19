import type {
  CommunicationAuditEventDraft,
  CommunicationEventEnvelope,
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
