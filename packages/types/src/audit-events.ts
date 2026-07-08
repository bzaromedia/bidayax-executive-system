import type { SettingsVersionEventName } from "./settings-version";

export const settingsAuditActorTypes = [
  "user",
  "system",
  "receptionist",
  "admin"
] as const;

export const settingsAuditSeverities = ["info", "warning", "critical"] as const;

export const settingsAuditSources = [
  "settings-versioning",
  "settings-publish",
  "receptionist-settings"
] as const;

export type SettingsAuditActorType =
  (typeof settingsAuditActorTypes)[number];
export type SettingsAuditSeverity =
  (typeof settingsAuditSeverities)[number];
export type SettingsAuditSource = (typeof settingsAuditSources)[number];
export type SettingsAuditMetadataValue = string | number | boolean | null;

export type SettingsAuditActor = {
  readonly actorId: string;
  readonly actorType: SettingsAuditActorType;
  readonly displayName: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
};

export type SettingsAuditEvent = {
  readonly eventId: string;
  readonly eventType: SettingsVersionEventName;
  readonly tenantId: string;
  readonly cardId: string;
  readonly actor: SettingsAuditActor;
  readonly occurredAt: string;
  readonly source: SettingsAuditSource;
  readonly snapshotHash: string | null;
  readonly previousSnapshotHash: string | null;
  readonly metadata: Readonly<Record<string, SettingsAuditMetadataValue>>;
  readonly severity: SettingsAuditSeverity;
};

export type SettingsAuditTrail = {
  readonly tenantId: string;
  readonly cardId: string;
  readonly events: readonly SettingsAuditEvent[];
  readonly latestSnapshotHash: string | null;
};
