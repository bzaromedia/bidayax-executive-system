import type { CommunicationChannel } from "../types";

export type CommunicationAuditEventDraft = {
  readonly eventId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
  readonly channel: CommunicationChannel | null;
  readonly actorId: string | null;
  readonly eventType: string;
  readonly reasonCode: string;
  readonly occurredAt: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
};
