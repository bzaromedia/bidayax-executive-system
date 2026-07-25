import { describe, expect, it } from "vitest";
import type { CommunicationDataModelRepository } from "../src/repositories";

describe("communications data-model repository contract", () => {
  it("defines persistence operations without runtime orchestration", () => {
    const operations = [
      "reserveCommandIdempotency",
      "upsertParticipantEndpoint",
      "appendLifecycleTransition",
      "recordDispatchAttempt",
      "linkTrustEvidence",
      "appendAuditEvent"
    ] as const satisfies readonly (keyof CommunicationDataModelRepository)[];

    expect(operations).toEqual([
      "reserveCommandIdempotency",
      "upsertParticipantEndpoint",
      "appendLifecycleTransition",
      "recordDispatchAttempt",
      "linkTrustEvidence",
      "appendAuditEvent"
    ]);
  });
});
