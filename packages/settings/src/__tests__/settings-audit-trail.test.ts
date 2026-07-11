import { describe, expect, it } from "vitest";
import type { SettingsAuditActor, SettingsAuditEvent } from "@bidayax/types";
import { createSettingsAuditEvent } from "../settings-audit-events";
import {
  appendSettingsAuditEvents,
  createSettingsAuditTrail,
  findSettingsAuditEventsByType
} from "../settings-audit-trail";

const actor: SettingsAuditActor = {
  actorId: "owner-1",
  actorType: "user",
  displayName: "Owner"
};

function auditEvent(input: {
  readonly eventType: SettingsAuditEvent["eventType"];
  readonly occurredAt: string;
  readonly snapshotHash: string | null;
  readonly cardId?: string;
}): SettingsAuditEvent {
  return createSettingsAuditEvent({
    actor,
    cardId: input.cardId ?? "card-ad-garner",
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    snapshotHash: input.snapshotHash,
    tenantId: "tenant-bidayax"
  });
}

describe("settings audit trail", () => {
  it("sorts events chronologically and tracks the latest snapshot", () => {
    const published = auditEvent({
      eventType: "settings.published",
      occurredAt: "2026-07-08T18:05:00.000Z",
      snapshotHash: "snapshot-2"
    });
    const draft = auditEvent({
      eventType: "settings.draft.created",
      occurredAt: "2026-07-08T18:00:00.000Z",
      snapshotHash: "snapshot-1"
    });
    const trail = createSettingsAuditTrail({
      cardId: "card-ad-garner",
      events: [published, draft],
      tenantId: "tenant-bidayax"
    });

    expect(trail.events.map((event) => event.eventType)).toEqual([
      "settings.draft.created",
      "settings.published"
    ]);
    expect(trail.latestSnapshotHash).toBe("snapshot-2");
    expect(Object.isFrozen(trail)).toBe(true);
  });

  it("deduplicates deterministic event IDs", () => {
    const event = auditEvent({
      eventType: "settings.preview.generated",
      occurredAt: "2026-07-08T18:01:00.000Z",
      snapshotHash: "snapshot-1"
    });
    const trail = createSettingsAuditTrail({
      cardId: "card-ad-garner",
      events: [event, event],
      tenantId: "tenant-bidayax"
    });

    expect(trail.events).toHaveLength(1);
  });

  it("appends immutable events and supports event-type queries", () => {
    const trail = createSettingsAuditTrail({
      cardId: "card-ad-garner",
      tenantId: "tenant-bidayax"
    });
    const event = auditEvent({
      eventType: "receptionist.settings.previewed",
      occurredAt: "2026-07-08T18:02:00.000Z",
      snapshotHash: "snapshot-1"
    });
    const updated = appendSettingsAuditEvents(trail, [event]);

    expect(trail.events).toHaveLength(0);
    expect(updated.events).toHaveLength(1);
    expect(
      findSettingsAuditEventsByType(
        updated,
        "receptionist.settings.previewed"
      )
    ).toEqual([event]);
  });

  it("rejects events from another card", () => {
    const event = auditEvent({
      cardId: "card-sean-hall",
      eventType: "settings.published",
      occurredAt: "2026-07-08T18:05:00.000Z",
      snapshotHash: "snapshot-2"
    });

    expect(() =>
      createSettingsAuditTrail({
        cardId: "card-ad-garner",
        events: [event],
        tenantId: "tenant-bidayax"
      })
    ).toThrow("Audit trail events must belong to one tenant and card.");
  });
});
