import type {
  CardAccessGrant,
  IdentityPermission,
  TenantMembership,
  TenantMembershipRole,
  TrustedSettingsAuthorizationContext,
  UserIdentity
} from "@bidayax/types";

export const rolePermissionPolicy: Readonly<
  Record<TenantMembershipRole, readonly IdentityPermission[]>
> = {
  tenant_owner: [
    "settings:read", "settings:update", "settings:preview", "settings:publish",
    "settings:history:read", "settings:asset:write", "receptionist:configure",
    "audit:read", "members:manage", "sessions:revoke", "card-access:manage"
  ],
  tenant_admin: [
    "settings:read", "settings:update", "settings:preview", "settings:publish",
    "settings:history:read", "settings:asset:write", "receptionist:configure",
    "audit:read", "members:manage", "sessions:revoke", "card-access:manage"
  ],
  executive: [
    "settings:read", "settings:update", "settings:preview",
    "settings:history:read", "receptionist:configure", "audit:read"
  ],
  settings_editor: [
    "settings:read", "settings:update", "settings:preview",
    "settings:history:read", "settings:asset:write"
  ],
  receptionist_manager: [
    "settings:read", "settings:history:read", "receptionist:configure"
  ],
  viewer: ["settings:read", "settings:history:read"]
};

export class IdentityAuthorizationError extends Error {
  readonly code:
    | "account_disabled"
    | "membership_denied"
    | "card_access_denied"
    | "permission_denied";

  constructor(code: IdentityAuthorizationError["code"], message: string) {
    super(message);
    this.name = "IdentityAuthorizationError";
    this.code = code;
  }
}

function activeGrant(
  grant: CardAccessGrant,
  now: number
): boolean {
  return !grant.revokedAt && (!grant.expiresAt || Date.parse(grant.expiresAt) > now);
}

export function resolveTrustedSettingsAuthorizationContext(input: {
  readonly authenticationMethod: string;
  readonly expiresAt: string;
  readonly grants: readonly CardAccessGrant[];
  readonly identity: UserIdentity;
  readonly issuedAt: string;
  readonly membership: TenantMembership;
  readonly provider: "workos";
  readonly sessionId: string;
}): TrustedSettingsAuthorizationContext {
  if (input.identity.status !== "active") {
    throw new IdentityAuthorizationError("account_disabled", "Identity is disabled.");
  }

  if (input.membership.status !== "active" || input.membership.revokedAt) {
    throw new IdentityAuthorizationError(
      "membership_denied",
      "Tenant membership is not active."
    );
  }

  const now = Date.parse(input.issuedAt);
  const rolePermissions = rolePermissionPolicy[input.membership.role];
  const validGrants = input.grants.filter(
    (grant) =>
      grant.tenantId === input.membership.tenantId &&
      grant.userId === input.identity.userId &&
      activeGrant(grant, now)
  );
  const privileged =
    input.membership.role === "tenant_owner" ||
    input.membership.role === "tenant_admin";

  const permissions = Array.from(
    new Set([
      ...rolePermissions,
      ...validGrants.flatMap((grant) => grant.permissionSet)
    ])
  );

  return {
    auditActor: {
      actorId: input.identity.userId,
      actorType: privileged ? "admin" : "user",
      displayName: input.identity.displayName
    },
    authenticationMethod: input.authenticationMethod,
    expiresAt: input.expiresAt,
    issuedAt: input.issuedAt,
    permissions,
    permittedCardIds: privileged ? [] : validGrants.map((grant) => grant.cardId),
    provider: input.provider,
    role: input.membership.role,
    sessionId: input.sessionId,
    tenantId: input.membership.tenantId,
    userId: input.identity.userId
  };
}

export function requireIdentityPermission(
  context: TrustedSettingsAuthorizationContext,
  permission: IdentityPermission,
  cardId?: string
): void {
  if (!context.permissions.includes(permission)) {
    throw new IdentityAuthorizationError(
      "permission_denied",
      `Permission ${permission} is required.`
    );
  }

  const privileged =
    context.role === "tenant_owner" || context.role === "tenant_admin";
  if (cardId && !privileged && !context.permittedCardIds.includes(cardId)) {
    throw new IdentityAuthorizationError(
      "card_access_denied",
      "The authenticated user is not authorized for this card."
    );
  }
}
