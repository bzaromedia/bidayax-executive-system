import type { TenantBrandProfile } from "./branding";
import type { ExecutiveCardProfile } from "./card-profile";
import type { ReceptionistSettings } from "./receptionist";
import type { ResolvedBrandTokens } from "./resolved-brand-tokens";

export const cardSettingsVersionStatuses = [
  "draft",
  "preview",
  "published",
  "archived"
] as const;

export const settingsVersionEventNames = [
  "settings.draft.created",
  "settings.preview.generated",
  "settings.publish.validation_failed",
  "settings.published",
  "settings.version.archived"
] as const;

export const settingsAuditEventTypes = [
  "settings.created",
  "settings.updated",
  "settings.previewed",
  "settings.published"
] as const;

export type CardSettingsVersionStatus =
  (typeof cardSettingsVersionStatuses)[number];

export type SettingsVersionEventName =
  (typeof settingsVersionEventNames)[number];

export type SettingsAuditEventType =
  | (typeof settingsAuditEventTypes)[number]
  | SettingsVersionEventName;

export type Tenant = {
  readonly tenantId: string;
  readonly companyName: string;
  readonly ownerEmail: string;
  readonly status: "active" | "suspended" | "archived";
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CardSettingsSnapshot = {
  readonly brandProfile: TenantBrandProfile;
  readonly resolvedBrandTokens: ResolvedBrandTokens;
  readonly cardProfile: ExecutiveCardProfile;
  readonly receptionistSettings: ReceptionistSettings;
  readonly snapshotHash: string;
  readonly generatedAt: string;
};

export type CardSettingsVersion = {
  readonly versionId: string;
  readonly cardId: string;
  readonly tenantId: string;
  readonly settingsSnapshot: CardSettingsSnapshot;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly status: CardSettingsVersionStatus;
  readonly snapshotHash: string;
  readonly immutable: boolean;
  readonly previousVersionId: string | null;
};

export type SettingsVersionEvent = {
  readonly eventId: string;
  readonly eventName: SettingsVersionEventName;
  readonly tenantId: string;
  readonly cardId: string;
  readonly versionId: string | null;
  readonly actorId: string;
  readonly createdAt: string;
  readonly metadata: Record<string, string | number | boolean | null>;
};

export type SettingsAuditEvent = {
  readonly eventId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly versionId: string | null;
  readonly eventType: SettingsAuditEventType;
  readonly actorId: string;
  readonly createdAt: string;
  readonly metadata: Record<string, string | number | boolean | null>;
};

export type SettingsPublishValidationCheck = {
  readonly checkId: string;
  readonly passed: boolean;
  readonly severity: "info" | "warning" | "blocker";
  readonly message: string;
};

export type SettingsPublishValidationResult = {
  readonly valid: boolean;
  readonly checks: readonly SettingsPublishValidationCheck[];
};

export type SettingsPublishResult = {
  readonly ok: boolean;
  readonly publishedVersionId: string | null;
  readonly archivedVersionId: string | null;
  readonly snapshotHash: string | null;
  readonly publishedVersion: CardSettingsVersion | null;
  readonly archivedVersion: CardSettingsVersion | null;
  readonly versions: readonly CardSettingsVersion[];
  readonly emittedEvents: readonly SettingsVersionEvent[];
  readonly warnings: readonly string[];
  readonly validation: SettingsPublishValidationResult;
};
