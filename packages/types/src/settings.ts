import type { ExecutiveCardProfile } from "./card-profile";
import type { TenantBrandProfile, ResolvedBrandTokenSnapshot } from "./branding";
import type { ReceptionistSettings } from "./receptionist";

export const cardSettingsVersionStatuses = [
  "draft",
  "preview",
  "published",
  "archived"
] as const;

export const settingsAuditEventTypes = [
  "settings.created",
  "settings.updated",
  "settings.previewed",
  "settings.published"
] as const;

export type CardSettingsVersionStatus =
  (typeof cardSettingsVersionStatuses)[number];

export type SettingsAuditEventType = (typeof settingsAuditEventTypes)[number];

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
  readonly resolvedBrandTokens: ResolvedBrandTokenSnapshot;
  readonly cardProfile: ExecutiveCardProfile;
  readonly receptionistSettings: ReceptionistSettings;
};

export type CardSettingsVersion = {
  readonly versionId: string;
  readonly cardId: string;
  readonly tenantId: string;
  readonly settingsSnapshot: CardSettingsSnapshot;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly status: CardSettingsVersionStatus;
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

export type SettingsPublishValidationResult = {
  readonly valid: boolean;
  readonly checks: readonly {
    readonly checkId: string;
    readonly passed: boolean;
    readonly severity: "info" | "warning" | "blocker";
    readonly message: string;
  }[];
};
