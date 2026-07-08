import type {
  SettingsAuditActor,
  SettingsAuditEvent,
  SettingsAuditMetadataValue,
  SettingsAuditSeverity,
  SettingsAuditSource,
  SettingsVersionEvent,
  SettingsVersionEventName
} from "@bidayax/types";

const sensitiveMetadataKeyPattern =
  /(authorization|cookie|credential|password|secret|session|token)/i;

export type CreateSettingsAuditEventInput = {
  readonly actor: SettingsAuditActor;
  readonly cardId: string;
  readonly eventType: SettingsVersionEventName;
  readonly metadata?: Readonly<Record<string, SettingsAuditMetadataValue>>;
  readonly occurredAt: string;
  readonly previousSnapshotHash?: string | null | undefined;
  readonly severity?: SettingsAuditSeverity;
  readonly snapshotHash?: string | null | undefined;
  readonly source?: SettingsAuditSource;
  readonly tenantId: string;
};

export type SettingsAuditEventContext = {
  readonly actor?: SettingsAuditActor | undefined;
  readonly actorId: string;
  readonly previousSnapshotHash?: string | null | undefined;
  readonly snapshotHash?: string | null | undefined;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function deterministicHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

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

export function sanitizeSettingsAuditMetadata(
  metadata: Readonly<Record<string, SettingsAuditMetadataValue>>
): Readonly<Record<string, SettingsAuditMetadataValue>> {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !sensitiveMetadataKeyPattern.test(key))
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

export function createSettingsAuditActor(
  actorId: string,
  actor?: SettingsAuditActor
): SettingsAuditActor {
  return deepFreeze(
    actor ?? {
      actorId,
      actorType: "user",
      displayName: actorId
    }
  );
}

export function inferSettingsAuditSource(
  eventType: SettingsVersionEventName
): SettingsAuditSource {
  if (eventType.startsWith("receptionist.")) {
    return "receptionist-settings";
  }

  return eventType.includes("publish") || eventType.includes("archived")
    ? "settings-publish"
    : "settings-versioning";
}

export function inferSettingsAuditSeverity(
  eventType: SettingsVersionEventName
): SettingsAuditSeverity {
  return eventType.includes("validation_failed") ? "warning" : "info";
}

export function createSettingsAuditEvent(
  input: CreateSettingsAuditEventInput
): SettingsAuditEvent {
  const metadata = sanitizeSettingsAuditMetadata(input.metadata ?? {});
  const eventWithoutId = {
    actor: input.actor,
    cardId: input.cardId,
    eventType: input.eventType,
    metadata,
    occurredAt: input.occurredAt,
    previousSnapshotHash: input.previousSnapshotHash ?? null,
    severity: input.severity ?? inferSettingsAuditSeverity(input.eventType),
    snapshotHash: input.snapshotHash ?? null,
    source: input.source ?? inferSettingsAuditSource(input.eventType),
    tenantId: input.tenantId
  };

  return deepFreeze({
    ...eventWithoutId,
    eventId: `settings-audit-${deterministicHash(eventWithoutId)}`
  });
}

export function createSettingsAuditEventFromVersionEvent(
  event: SettingsVersionEvent,
  context: SettingsAuditEventContext
): SettingsAuditEvent {
  return createSettingsAuditEvent({
    actor: createSettingsAuditActor(context.actorId, context.actor),
    cardId: event.cardId,
    eventType: event.eventName,
    metadata: {
      ...event.metadata,
      versionId: event.versionId
    },
    occurredAt: event.createdAt,
    previousSnapshotHash: context.previousSnapshotHash,
    snapshotHash: context.snapshotHash,
    tenantId: event.tenantId
  });
}

export function createSettingsAuditEvents(
  events: readonly SettingsVersionEvent[],
  context: SettingsAuditEventContext
): readonly SettingsAuditEvent[] {
  return deepFreeze(
    events.map((event) => createSettingsAuditEventFromVersionEvent(event, context))
  );
}
