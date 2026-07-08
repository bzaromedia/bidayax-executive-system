import type {
  CardSettingsSnapshot,
  CardSettingsVersion,
  CardSettingsVersionStatus,
  SettingsVersionEvent,
  SettingsVersionEventName
} from "@bidayax/types";

export type SettingsVersionActorContext = {
  readonly actorId: string;
  readonly createdAt?: string;
};

export type CreateCardSettingsSnapshotInput = Omit<
  CardSettingsSnapshot,
  "generatedAt" | "snapshotHash"
> & {
  readonly generatedAt?: string;
};

export type CreateSettingsDraftInput = SettingsVersionActorContext & {
  readonly settingsSnapshot: CardSettingsSnapshot;
  readonly previousVersionId?: string | null;
  readonly versionId?: string;
};

export type GeneratePreviewVersionInput = SettingsVersionActorContext & {
  readonly draftVersion: CardSettingsVersion;
  readonly versionId?: string;
};

export type ArchiveSettingsVersionInput = SettingsVersionActorContext & {
  readonly publishedVersion: CardSettingsVersion;
  readonly versionId?: string;
};

export type SettingsVersionOperationResult = {
  readonly version: CardSettingsVersion;
  readonly emittedEvents: readonly SettingsVersionEvent[];
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right)
  );

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

export function createSettingsStableHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `settings-fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function createdAtOrNow(createdAt?: string): string {
  return createdAt ?? new Date().toISOString();
}

function createVersionId(
  status: CardSettingsVersionStatus,
  snapshotHash: string,
  createdAt: string
): string {
  return `settings-version-${createSettingsStableHash({ createdAt, snapshotHash, status })}`;
}

function createEventId(
  eventName: SettingsVersionEventName,
  versionId: string | null,
  createdAt: string
): string {
  return `settings-event-${createSettingsStableHash({ createdAt, eventName, versionId })}`;
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

function createSettingsVersionEvent(input: {
  readonly actorId: string;
  readonly cardId: string;
  readonly createdAt: string;
  readonly eventName: SettingsVersionEventName;
  readonly metadata?: Record<string, string | number | boolean | null>;
  readonly tenantId: string;
  readonly versionId: string | null;
}): SettingsVersionEvent {
  return {
    actorId: input.actorId,
    cardId: input.cardId,
    createdAt: input.createdAt,
    eventId: createEventId(input.eventName, input.versionId, input.createdAt),
    eventName: input.eventName,
    metadata: input.metadata ?? {},
    tenantId: input.tenantId,
    versionId: input.versionId
  };
}

export function createCardSettingsSnapshot(
  input: CreateCardSettingsSnapshotInput
): CardSettingsSnapshot {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const snapshotHash = createSettingsStableHash({
    brandProfile: input.brandProfile,
    cardProfile: input.cardProfile,
    receptionistSettings: input.receptionistSettings,
    resolvedBrandTokens: input.resolvedBrandTokens
  });

  return deepFreeze({
    ...input,
    generatedAt,
    snapshotHash
  });
}

export function createSettingsDraft(
  input: CreateSettingsDraftInput
): SettingsVersionOperationResult {
  const createdAt = createdAtOrNow(input.createdAt);
  const versionId =
    input.versionId ?? createVersionId("draft", input.settingsSnapshot.snapshotHash, createdAt);
  const version = deepFreeze({
    cardId: input.settingsSnapshot.cardProfile.cardId,
    createdAt,
    createdBy: input.actorId,
    immutable: false,
    previousVersionId: input.previousVersionId ?? null,
    settingsSnapshot: input.settingsSnapshot,
    snapshotHash: input.settingsSnapshot.snapshotHash,
    status: "draft" as const,
    tenantId: input.settingsSnapshot.cardProfile.tenantId,
    versionId
  });

  return {
    emittedEvents: [
      createSettingsVersionEvent({
        actorId: input.actorId,
        cardId: version.cardId,
        createdAt,
        eventName: "settings.draft.created",
        metadata: {
          snapshotHash: version.snapshotHash,
          status: version.status
        },
        tenantId: version.tenantId,
        versionId
      })
    ],
    version
  };
}

export function generatePreviewVersion(
  input: GeneratePreviewVersionInput
): SettingsVersionOperationResult {
  const createdAt = createdAtOrNow(input.createdAt);
  const versionId =
    input.versionId ?? createVersionId("preview", input.draftVersion.snapshotHash, createdAt);
  const version = deepFreeze({
    ...input.draftVersion,
    createdAt,
    createdBy: input.actorId,
    immutable: false,
    status: "preview" as const,
    versionId
  });

  return {
    emittedEvents: [
      createSettingsVersionEvent({
        actorId: input.actorId,
        cardId: version.cardId,
        createdAt,
        eventName: "settings.preview.generated",
        metadata: {
          draftVersionId: input.draftVersion.versionId,
          snapshotHash: version.snapshotHash,
          status: version.status
        },
        tenantId: version.tenantId,
        versionId
      })
    ],
    version
  };
}

export function archivePublishedVersion(
  input: ArchiveSettingsVersionInput
): SettingsVersionOperationResult {
  const createdAt = createdAtOrNow(input.createdAt);
  const versionId = input.versionId ?? input.publishedVersion.versionId;
  const version = deepFreeze({
    ...input.publishedVersion,
    createdAt,
    createdBy: input.actorId,
    immutable: true,
    status: "archived" as const,
    versionId
  });

  return {
    emittedEvents: [
      createSettingsVersionEvent({
        actorId: input.actorId,
        cardId: version.cardId,
        createdAt,
        eventName: "settings.version.archived",
        metadata: {
          archivedFromStatus: input.publishedVersion.status,
          previousVersionId: input.publishedVersion.versionId,
          snapshotHash: version.snapshotHash
        },
        tenantId: version.tenantId,
        versionId
      })
    ],
    version
  };
}

export function findCurrentPublishedVersion(
  versions: readonly CardSettingsVersion[],
  cardId: string,
  tenantId: string
): CardSettingsVersion | null {
  return (
    versions.find(
      (version) =>
        version.cardId === cardId &&
        version.tenantId === tenantId &&
        version.status === "published"
    ) ?? null
  );
}
