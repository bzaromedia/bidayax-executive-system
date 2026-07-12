import type { SettingsAuditActor } from "@bidayax/types";

export const settingsActorRoles = [
  "administrator",
  "tenant_owner",
  "tenant_admin",
  "executive",
  "settings_editor",
  "receptionist_manager",
  "viewer",
  "system"
] as const;

export const settingsPermissions = [
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
  "card-access:manage"
] as const;

export type SettingsActorRole = (typeof settingsActorRoles)[number];
export type SettingsPermission = (typeof settingsPermissions)[number];

export type SettingsAuthorizationContext = {
  readonly actorId: string;
  readonly displayName: string;
  readonly role: SettingsActorRole;
  readonly tenantId: string;
  readonly cardIds?: readonly string[];
  readonly permissions?: readonly SettingsPermission[];
  readonly ipAddress?: string | undefined;
  readonly userAgent?: string | undefined;
};

export type SettingsAuthorizationResource = {
  readonly tenantId: string;
  readonly cardId?: string | undefined;
};

export type SettingsAuthorizationDecision = {
  readonly allowed: boolean;
  readonly auditActor: SettingsAuditActor;
  readonly permission: SettingsPermission;
  readonly reason: string;
};

const rolePermissions: Record<SettingsActorRole, readonly SettingsPermission[]> = {
  administrator: settingsPermissions,
  tenant_owner: settingsPermissions,
  tenant_admin: settingsPermissions,
  executive: [
    "settings:read",
    "settings:update",
    "settings:preview",
    "settings:history:read"
  ],
  settings_editor: [
    "settings:read",
    "settings:update",
    "settings:preview",
    "settings:history:read",
    "settings:asset:write"
  ],
  receptionist_manager: [
    "settings:read",
    "settings:history:read",
    "receptionist:configure"
  ],
  system: [
    "settings:read",
    "settings:preview",
    "settings:publish",
    "settings:history:read"
  ],
  viewer: ["settings:read", "settings:history:read"]
};

export class SettingsAuthorizationError extends Error {
  readonly decision: SettingsAuthorizationDecision;

  constructor(decision: SettingsAuthorizationDecision) {
    super(decision.reason);
    this.name = "SettingsAuthorizationError";
    this.decision = decision;
  }
}

function toAuditActor(
  context: SettingsAuthorizationContext
): SettingsAuditActor {
  const actor: SettingsAuditActor = {
    actorId: context.actorId,
    actorType:
      context.role === "system"
        ? "system"
        : context.role === "administrator" ||
            context.role === "tenant_owner" ||
            context.role === "tenant_admin"
          ? "admin"
          : "user",
    displayName: context.displayName
  };

  return {
    ...actor,
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {})
  };
}

function cardAllowed(
  context: SettingsAuthorizationContext,
  resource: SettingsAuthorizationResource
): boolean {
  if (
    !resource.cardId ||
    context.role === "administrator" ||
    context.role === "tenant_owner" ||
    context.role === "tenant_admin" ||
    context.role === "system"
  ) {
    return true;
  }

  return Boolean(context.cardIds?.includes(resource.cardId));
}

export function authorizeSettingsAction(input: {
  readonly context: SettingsAuthorizationContext;
  readonly permission: SettingsPermission;
  readonly resource: SettingsAuthorizationResource;
}): SettingsAuthorizationDecision {
  const auditActor = toAuditActor(input.context);

  if (input.context.tenantId !== input.resource.tenantId) {
    return {
      allowed: false,
      auditActor,
      permission: input.permission,
      reason: "Actor tenant does not match the requested settings resource."
    };
  }

  const effectivePermissions = new Set([
    ...rolePermissions[input.context.role],
    ...(input.context.permissions ?? [])
  ]);

  if (!effectivePermissions.has(input.permission)) {
    return {
      allowed: false,
      auditActor,
      permission: input.permission,
      reason: `Role ${input.context.role} cannot perform ${input.permission}.`
    };
  }

  if (!cardAllowed(input.context, input.resource)) {
    return {
      allowed: false,
      auditActor,
      permission: input.permission,
      reason: "Actor is not assigned to the requested card."
    };
  }

  return {
    allowed: true,
    auditActor,
    permission: input.permission,
    reason: "Settings action authorized."
  };
}

export function requireSettingsAuthorization(input: {
  readonly context: SettingsAuthorizationContext;
  readonly permission: SettingsPermission;
  readonly resource: SettingsAuthorizationResource;
}): SettingsAuthorizationDecision {
  const decision = authorizeSettingsAction(input);

  if (!decision.allowed) {
    throw new SettingsAuthorizationError(decision);
  }

  return decision;
}
