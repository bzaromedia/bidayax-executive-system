import type { CommunicationChannel } from "../types";

export type CommunicationTrustEvidenceDraft = {
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
  readonly channel: CommunicationChannel | null;
  readonly eventType: string;
  readonly reasonCode: string;
  readonly occurredAt: string;
  readonly subjectId: string;
  readonly attributes: Readonly<Record<string, string | number | boolean | null>>;
};
