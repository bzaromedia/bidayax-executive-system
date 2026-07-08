import type {
  SettingsAuditEvent,
  SettingsAuditTrail,
  SettingsVersionEventName
} from "@bidayax/types";

export type CreateSettingsAuditTrailInput = {
  readonly cardId: string;
  readonly events?: readonly SettingsAuditEvent[];
  readonly tenantId: string;
};

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry);
  }

  return value;
}

function normalizeEvents(
  tenantId: string,
  cardId: string,
  events: readonly SettingsAuditEvent[]
): readonly SettingsAuditEvent[] {
  for (const event of events) {
    if (event.tenantId !== tenantId || event.cardId !== cardId) {
      throw new Error("Audit trail events must belong to one tenant and card.");
    }
  }

  const unique = new Map(events.map((event) => [event.eventId, event]));
  return [...unique.values()].sort(
    (left, right) =>
      left.occurredAt.localeCompare(right.occurredAt) ||
      left.eventId.localeCompare(right.eventId)
  );
}

export function createSettingsAuditTrail(
  input: CreateSettingsAuditTrailInput
): SettingsAuditTrail {
  const events = normalizeEvents(
    input.tenantId,
    input.cardId,
    input.events ?? []
  );
  const latestSnapshotHash =
    [...events].reverse().find((event) => event.snapshotHash !== null)
      ?.snapshotHash ?? null;

  return deepFreeze({
    cardId: input.cardId,
    events,
    latestSnapshotHash,
    tenantId: input.tenantId
  });
}

export function appendSettingsAuditEvents(
  trail: SettingsAuditTrail,
  events: readonly SettingsAuditEvent[]
): SettingsAuditTrail {
  return createSettingsAuditTrail({
    cardId: trail.cardId,
    events: [...trail.events, ...events],
    tenantId: trail.tenantId
  });
}

export function findSettingsAuditEventsByType(
  trail: SettingsAuditTrail,
  eventType: SettingsVersionEventName
): readonly SettingsAuditEvent[] {
  return trail.events.filter((event) => event.eventType === eventType);
}
