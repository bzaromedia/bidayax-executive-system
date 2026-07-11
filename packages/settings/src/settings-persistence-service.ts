import type {
  BrandAsset,
  CardSettingsSnapshot,
  SettingsAuditEvent,
  SettingsPublishResult,
  Tenant
} from "@bidayax/types";
import {
  createSettingsPersistenceRepository,
  SettingsPersistenceConflictError
} from "./settings-persistence";
import type {
  SettingsIdempotencyRecord,
  SettingsPersistenceRepository,
  SettingsQueryExecutor
} from "./settings-persistence";

export type PersistSettingsSnapshotInput = {
  readonly assets?: readonly BrandAsset[];
  readonly repository: SettingsPersistenceRepository;
  readonly snapshot: CardSettingsSnapshot;
  readonly tenant: Tenant;
};

export type PersistSettingsSnapshotResult = {
  readonly assetCount: number;
  readonly cardId: string;
  readonly tenantId: string;
};

export type PersistSettingsPublishResultInput = {
  readonly repository: SettingsPersistenceRepository;
  readonly publishResult: SettingsPublishResult;
};

export type PersistSettingsPublishResult = {
  readonly auditEventCount: number;
  readonly persistedVersionIds: readonly string[];
};

export type PersistIdempotentSettingsPublishResultInput =
  PersistSettingsPublishResultInput & {
    readonly createdAt: string;
    readonly expiresAt?: string | null;
    readonly idempotencyKey: string;
    readonly requestHash: string;
  };

export type PersistIdempotentSettingsPublishResult =
  PersistSettingsPublishResult & {
    readonly idempotencyRecord: SettingsIdempotencyRecord;
    readonly reusedExistingResult: boolean;
  };

export type PersistSettingsPublishTransactionInput = {
  readonly executor: SettingsQueryExecutor;
  readonly publishResult: SettingsPublishResult;
};

export async function persistSettingsSnapshot(
  input: PersistSettingsSnapshotInput
): Promise<PersistSettingsSnapshotResult> {
  await input.repository.saveTenant(input.tenant);

  for (const asset of input.assets ?? []) {
    await input.repository.saveBrandAsset(asset);
  }

  await input.repository.saveTenantBrandProfile(input.snapshot.brandProfile);
  await input.repository.saveExecutiveCardProfile(input.snapshot.cardProfile);
  await input.repository.saveReceptionistSettings(
    input.snapshot.receptionistSettings
  );

  return {
    assetCount: input.assets?.length ?? 0,
    cardId: input.snapshot.cardProfile.cardId,
    tenantId: input.snapshot.cardProfile.tenantId
  };
}

export async function persistSettingsAuditEvents(
  repository: SettingsPersistenceRepository,
  auditEvents: readonly SettingsAuditEvent[]
): Promise<number> {
  for (const event of auditEvents) {
    await repository.saveSettingsAuditEvent(event);
  }

  return auditEvents.length;
}

export async function persistSettingsPublishResult(
  input: PersistSettingsPublishResultInput
): Promise<PersistSettingsPublishResult> {
  const persistedVersionIds: string[] = [];
  const publishTarget = input.publishResult.publishedVersion ??
    input.publishResult.versions[0];

  if (publishTarget) {
    const locked = await input.repository.lockExecutiveCardForSettingsPublish(
      publishTarget.tenantId,
      publishTarget.cardId
    );

    if (!locked) {
      throw new SettingsPersistenceConflictError(
        `Card ${publishTarget.cardId} could not be locked for tenant ${publishTarget.tenantId}.`
      );
    }
  }

  if (input.publishResult.archivedVersion) {
    await input.repository.archiveCardSettingsVersion(
      input.publishResult.archivedVersion
    );
    persistedVersionIds.push(input.publishResult.archivedVersion.versionId);
  }

  for (const version of input.publishResult.versions) {
    if (
      input.publishResult.archivedVersion &&
      version.versionId === input.publishResult.archivedVersion.versionId
    ) {
      continue;
    }

    await input.repository.saveCardSettingsVersion(version);
    persistedVersionIds.push(version.versionId);
  }

  const auditEventCount = await persistSettingsAuditEvents(
    input.repository,
    input.publishResult.auditEvents
  );

  return {
    auditEventCount,
    persistedVersionIds
  };
}

export async function persistIdempotentSettingsPublishResult(
  input: PersistIdempotentSettingsPublishResultInput
): Promise<PersistIdempotentSettingsPublishResult> {
  const publishTarget = input.publishResult.publishedVersion ??
    input.publishResult.versions[0];

  if (!publishTarget) {
    throw new SettingsPersistenceConflictError(
      "Cannot persist an idempotent publish result without a target settings version."
    );
  }

  const existing = await input.repository.getSettingsIdempotencyRecord(
    publishTarget.tenantId,
    publishTarget.cardId,
    "settings.publish",
    input.idempotencyKey
  );

  if (existing) {
    if (existing.requestHash !== input.requestHash) {
      throw new SettingsPersistenceConflictError(
        `Idempotency key ${input.idempotencyKey} was reused with different request content.`
      );
    }

    return {
      auditEventCount: 0,
      idempotencyRecord: existing,
      persistedVersionIds: existing.resultVersionId ? [existing.resultVersionId] : [],
      reusedExistingResult: true
    };
  }

  const result = await persistSettingsPublishResult(input);
  const idempotencyRecord = await input.repository.saveSettingsIdempotencyRecord({
    cardId: publishTarget.cardId,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt ?? null,
    idempotencyKey: input.idempotencyKey,
    operation: "settings.publish",
    requestHash: input.requestHash,
    resultSnapshotHash: input.publishResult.snapshotHash,
    resultVersionId: input.publishResult.publishedVersionId,
    tenantId: publishTarget.tenantId
  });

  return {
    ...result,
    idempotencyRecord,
    reusedExistingResult: false
  };
}

export async function persistSettingsPublishResultTransactionally(
  input: PersistSettingsPublishTransactionInput
): Promise<PersistSettingsPublishResult> {
  await input.executor.query("begin");

  try {
    const result = await persistSettingsPublishResult({
      publishResult: input.publishResult,
      repository: createSettingsPersistenceRepository(input.executor)
    });
    await input.executor.query("commit");

    return result;
  } catch (error) {
    await input.executor.query("rollback");
    throw error;
  }
}
