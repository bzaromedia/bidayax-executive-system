import type {
  BrandAsset,
  CardSettingsSnapshot,
  SettingsAuditEvent,
  SettingsPublishResult,
  Tenant
} from "@bidayax/types";
import type { SettingsPersistenceRepository } from "./settings-persistence";

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

  for (const version of input.publishResult.versions) {
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
