export type CommunicationOutboxRecord = {
  readonly outboxId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string;
  readonly adapterId: string;
  readonly attemptNumber: number;
  readonly idempotencyKey: string;
  readonly availableAt: string;
};

export interface CommunicationOutboxRepository {
  enqueue(record: CommunicationOutboxRecord): Promise<void>;
  claimReady(limit: number): Promise<readonly CommunicationOutboxRecord[]>;
  markCompleted(outboxId: string): Promise<void>;
  markFailed(outboxId: string, reasonCode: string): Promise<void>;
}
