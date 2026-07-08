import { describe, expect, it } from "vitest";
import {
  settingsVersionEventNames,
  type SettingsAuditActor,
  type SettingsVersionEvent
} from "@bidayax/types";
import {
  createSettingsAuditActor,
  createSettingsAuditEvent,
  createSettingsAuditEventFromVersionEvent,
  inferSettingsAuditSeverity,
  inferSettingsAuditSource,
  sanitizeSettingsAuditMetadata
} from "../settings-audit-events";

const actor: SettingsAuditActor = {
  actorId: "owner-1",
  actorType: "admin",
  displayName: "Release Owner",
  ipAddress: "192.0.2.10",
  userAgent: "Phase2F-Test"
};

function versionEvent(
  eventName: SettingsVersionEvent["eventName"] = "settings.published"
): SettingsVersionEvent {
  return {
    actorId: actor.actorId,
    cardId: "card-ad-garner",
    createdAt: "2026-07-08T18:00:00.000Z",
    eventId: "legacy-event-1",
    eventName,
    metadata: {
      snapshotHash: "snapshot-current",
      status: "published"
    },
    tenantId: "tenant-bidayax",
    versionId: "version-2"
  };
}

describe("settings audit event builders", () => {
  it("builds the required standardized audit envelope", () => {
    const event = createSettingsAuditEventFromVersionEvent(versionEvent(), {
      actor,
      actorId: actor.actorId,
      previousSnapshotHash: "snapshot-previous",
      snapshotHash: "snapshot-current"
    });

    expect(event).toEqual(
      expect.objectContaining({
        actor,
        cardId: "card-ad-garner",
        eventType: "settings.published",
        occurredAt: "2026-07-08T18:00:00.000Z",
        previousSnapshotHash: "snapshot-previous",
        severity: "info",
        snapshotHash: "snapshot-current",
        source: "settings-publish",
        tenantId: "tenant-bidayax"
      })
    );
    expect(event.eventId).toMatch(/^settings-audit-[a-f0-9]{8}$/);
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("generates deterministic IDs independent of metadata key order", () => {
    const first = createSettingsAuditEvent({
      actor,
      cardId: "card-ad-garner",
      eventType: "settings.preview.generated",
      metadata: { alpha: "one", beta: 2 },
      occurredAt: "2026-07-08T18:00:00.000Z",
      snapshotHash: "snapshot-current",
      tenantId: "tenant-bidayax"
    });
    const second = createSettingsAuditEvent({
      actor,
      cardId: "card-ad-garner",
      eventType: "settings.preview.generated",
      metadata: { beta: 2, alpha: "one" },
      occurredAt: "2026-07-08T18:00:00.000Z",
      snapshotHash: "snapshot-current",
      tenantId: "tenant-bidayax"
    });

    expect(first.eventId).toBe(second.eventId);
  });

  it("removes sensitive metadata keys before ID generation and output", () => {
    const metadata = sanitizeSettingsAuditMetadata({
      authorization: "Bearer secret",
      password: "unsafe",
      reason: "validation",
      tokenValue: "unsafe"
    });

    expect(metadata).toEqual({ reason: "validation" });
  });

  it("retains complete typed actor metadata", () => {
    expect(createSettingsAuditActor(actor.actorId, actor)).toEqual(actor);
    expect(createSettingsAuditActor("system-settings")).toEqual({
      actorId: "system-settings",
      actorType: "user",
      displayName: "system-settings"
    });
  });

  it("assigns source and severity for every required settings event", () => {
    for (const eventType of settingsVersionEventNames) {
      expect(inferSettingsAuditSource(eventType)).toMatch(
        /^(settings-versioning|settings-publish|receptionist-settings)$/
      );
      expect(inferSettingsAuditSeverity(eventType)).toMatch(/^(info|warning)$/);
    }

    expect(inferSettingsAuditSeverity("settings.publish.validation_failed")).toBe(
      "warning"
    );
    expect(
      inferSettingsAuditSource("receptionist.settings.validation_failed")
    ).toBe("receptionist-settings");
  });

  it("supports explicit critical severity for future policy escalation", () => {
    const event = createSettingsAuditEvent({
      actor,
      cardId: "card-ad-garner",
      eventType: "settings.publish.validation_failed",
      occurredAt: "2026-07-08T18:00:00.000Z",
      severity: "critical",
      tenantId: "tenant-bidayax"
    });

    expect(event.severity).toBe("critical");
  });
});
