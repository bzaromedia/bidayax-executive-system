import type { CallQueue, CallSession } from "@bidayax/types";

export type QueuePlacement = {
  readonly accepted: boolean;
  readonly queueId: string;
  readonly position: number | null;
  readonly reasonCodes: readonly string[];
};

export function placeCallInQueue({
  queue,
  existingSessions,
  session
}: {
  readonly queue: CallQueue;
  readonly existingSessions: readonly CallSession[];
  readonly session: CallSession;
}): QueuePlacement {
  if (queue.status !== "active") {
    return {
      accepted: false,
      queueId: queue.queueId,
      position: null,
      reasonCodes: ["QUEUE_NOT_ACTIVE"]
    };
  }

  if (queue.tenantId !== session.tenantId) {
    return {
      accepted: false,
      queueId: queue.queueId,
      position: null,
      reasonCodes: ["QUEUE_TENANT_MISMATCH"]
    };
  }

  const queueDepth = existingSessions.filter(
    (candidate) => candidate.tenantId === queue.tenantId && candidate.state === "queued"
  ).length;

  if (queueDepth >= queue.maxDepth) {
    return {
      accepted: false,
      queueId: queue.queueId,
      position: null,
      reasonCodes: ["QUEUE_DEPTH_LIMIT_REACHED"]
    };
  }

  return {
    accepted: true,
    queueId: queue.queueId,
    position: queueDepth + 1,
    reasonCodes: ["CALL_QUEUED"]
  };
}
