export const identityProviders = ["workos"] as const;
export type IdentityProvider = (typeof identityProviders)[number];

export const userIdentityStatuses = ["active", "disabled"] as const;
export type UserIdentityStatus = (typeof userIdentityStatuses)[number];

export const tenantMembershipRoles = [
  "tenant_owner",
  "tenant_admin",
  "executive",
  "settings_editor",
  "receptionist_manager",
  "viewer"
] as const;
export type TenantMembershipRole = (typeof tenantMembershipRoles)[number];

export const identityRecordStatuses = ["active", "revoked"] as const;
export type IdentityRecordStatus = (typeof identityRecordStatuses)[number];

export const identityPermissions = [
  "settings:read",
  "settings:update",
  "settings:preview",
  "settings:publish",
  "settings:history:read",
  "settings:asset:write",
  "receptionist:configure",
  "audit:read",
  "members:manage",
  "sessions:revoke",
  "card-access:manage",
  "trust.verify",
  "trust.keys.read",
  "trust.keys.manage",
  "trust.provenance.read",
  "trust.audit.verify",
  "trust.merkle.verify",
  "trust.revocations.read"
] as const;
export type IdentityPermission = (typeof identityPermissions)[number];

export type UserIdentity = {
  readonly userId: string;
  readonly provider: IdentityProvider;
  readonly providerSubject: string;
  readonly email: string;
  readonly normalizedEmail: string;
  readonly emailVerified: boolean;
  readonly displayName: string;
  readonly avatarUrl?: string | null;
  readonly status: UserIdentityStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastAuthenticatedAt: string;
};

export type IdentityProviderAccount = {
  readonly providerAccountId: string;
  readonly userId: string;
  readonly provider: IdentityProvider;
  readonly providerSubject: string;
  readonly providerTenantId?: string | null;
  readonly providerMetadata: Readonly<Record<string, string | number | boolean | null>>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TenantMembership = {
  readonly membershipId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly role: TenantMembershipRole;
  readonly status: IdentityRecordStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revokedAt?: string | null;
};

export type CardAccessGrant = {
  readonly grantId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly userId: string;
  readonly permissionSet: readonly IdentityPermission[];
  readonly createdAt: string;
  readonly expiresAt?: string | null;
  readonly revokedAt?: string | null;
};

export type ApplicationSession = {
  readonly sessionId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly provider: IdentityProvider;
  readonly providerSessionId?: string | null;
  readonly authenticationMethod: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly idleExpiresAt: string;
  readonly absoluteExpiresAt: string;
  readonly revokedAt?: string | null;
  readonly rotatedFromSessionId?: string | null;
};

export type TrustedSettingsAuthorizationContext = {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: TenantMembershipRole;
  readonly permittedCardIds: readonly string[];
  readonly permissions: readonly IdentityPermission[];
  readonly sessionId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly authenticationMethod: string;
  readonly provider: IdentityProvider;
  readonly auditActor: {
    readonly actorId: string;
    readonly actorType: "user" | "admin";
    readonly displayName: string;
  };
};

export const identityAuditEventTypes = [
  "identity.login.started",
  "identity.login.succeeded",
  "identity.login.failed",
  "identity.logout",
  "identity.session.created",
  "identity.session.refreshed",
  "identity.session.revoked",
  "identity.membership.denied",
  "identity.card_access.denied",
  "identity.provider_webhook.received",
  "identity.provider_webhook.rejected",
  "identity.account.disabled"
] as const;
export type IdentityAuditEventType = (typeof identityAuditEventTypes)[number];

export type IdentityAuditEvent = {
  readonly eventId: string;
  readonly eventType: IdentityAuditEventType;
  readonly userId?: string | null;
  readonly tenantId?: string | null;
  readonly sessionId?: string | null;
  readonly provider: IdentityProvider;
  readonly occurredAt: string;
  readonly result: "succeeded" | "failed" | "denied";
  readonly reasonCode: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
};
