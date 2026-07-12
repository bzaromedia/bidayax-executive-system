import { describe, expect, it } from "vitest";
import { createIdentityAuditEvent } from "../audit";

describe("identity audit events", () => {
  it("removes credentials, tokens, cookies, and raw payloads", () => {
    const event = createIdentityAuditEvent({
      eventType: "identity.login.failed",
      metadata: {
        authorization: "Bearer secret",
        cookie: "session=secret",
        harmless: "kept",
        providerToken: "secret",
        rawPayload: "secret"
      },
      occurredAt: "2026-01-01T00:00:00.000Z",
      reasonCode: "INVALID_CALLBACK",
      result: "failed"
    });
    expect(event.metadata).toEqual({ harmless: "kept" });
    expect(event.eventId).toHaveLength(64);
  });

  it("produces deterministic IDs for identical evidence", () => {
    const input = {
      eventType: "identity.login.failed" as const,
      occurredAt: "2026-01-01T00:00:00.000Z",
      reasonCode: "INVALID_CALLBACK",
      result: "failed" as const
    };
    expect(createIdentityAuditEvent(input).eventId).toBe(
      createIdentityAuditEvent(input).eventId
    );
  });
});
