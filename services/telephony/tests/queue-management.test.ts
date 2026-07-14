import { describe, expect, it } from "vitest";
import type { CallQueue, CallSession } from "@bidayax/types";
import { placeCallInQueue } from "../src/queue-management";

const queue: CallQueue = {
  cardId: "card-1",
  createdAt: "2026-07-13T00:00:00.000Z",
  maxDepth: 2,
  name: "Executive Queue",
  priority: 1,
  queueId: "queue-1",
  status: "active",
  tenantId: "tenant-1",
  updatedAt: "2026-07-13T00:00:00.000Z"
};

const session: CallSession = {
  caller: { phoneNumber: "+15555550100" },
  callee: { phoneNumber: "+15555550101" },
  cardId: "card-1",
  direction: "inbound",
  metadata: {},
  phoneNumberId: "phone-1",
  sessionId: "session-1",
  state: "queued",
  tenantId: "tenant-1"
};

describe("queue management", () => {
  it("places calls into an active tenant-owned queue", () => {
    expect(
      placeCallInQueue({ existingSessions: [], queue, session })
    ).toEqual({
      accepted: true,
      position: 1,
      queueId: "queue-1",
      reasonCodes: ["CALL_QUEUED"]
    });
  });

  it("rejects tenant mismatches", () => {
    expect(
      placeCallInQueue({
        existingSessions: [],
        queue,
        session: { ...session, tenantId: "tenant-other" }
      }).reasonCodes
    ).toContain("QUEUE_TENANT_MISMATCH");
  });

  it("rejects queues over depth", () => {
    const result = placeCallInQueue({
      existingSessions: [session, { ...session, sessionId: "session-2" }],
      queue,
      session: { ...session, sessionId: "session-3" }
    });

    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain("QUEUE_DEPTH_LIMIT_REACHED");
  });
});
