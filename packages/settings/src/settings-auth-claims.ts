import type { SettingsAuthorizationContext } from "./settings-authorization";
import { settingsActorRoles, type SettingsActorRole } from "./settings-authorization";

export type TrustedSettingsAuthClaims = {
  readonly actorId: string;
  readonly displayName: string;
  readonly role: SettingsActorRole;
  readonly tenantId: string;
  readonly cardIds?: readonly string[];
  readonly expiresAt?: string | undefined;
  readonly issuedAt?: string | undefined;
};

export type TrustedSettingsAuthValidationResult =
  | {
      readonly claims: TrustedSettingsAuthClaims;
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseStringArray(value: unknown): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => !hasText(entry))) {
    return [];
  }

  return value.map((entry) => entry.trim());
}

export function validateTrustedSettingsAuthClaims(input: {
  readonly now?: string | undefined;
  readonly payload: unknown;
  readonly resourceCardId?: string | undefined;
  readonly resourceTenantId: string;
}): TrustedSettingsAuthValidationResult {
  if (!input.payload || typeof input.payload !== "object") {
    return { ok: false, reason: "Trusted settings auth payload is missing." };
  }

  const payload = input.payload as Record<string, unknown>;
  const role = payload.role;
  const cardIds = parseStringArray(payload.cardIds);

  if (!hasText(payload.actorId)) {
    return { ok: false, reason: "Trusted settings auth actor is missing." };
  }

  if (!hasText(payload.displayName)) {
    return { ok: false, reason: "Trusted settings auth display name is missing." };
  }

  if (!hasText(payload.tenantId) || payload.tenantId !== input.resourceTenantId) {
    return { ok: false, reason: "Trusted settings auth tenant does not match the requested resource." };
  }

  if (typeof role !== "string" || !settingsActorRoles.includes(role as SettingsActorRole)) {
    return { ok: false, reason: "Trusted settings auth role is unsupported." };
  }

  if (cardIds && cardIds.length === 0) {
    return { ok: false, reason: "Trusted settings auth card assignments are invalid." };
  }

  if (
    input.resourceCardId &&
    role !== "administrator" &&
    role !== "system" &&
    !cardIds?.includes(input.resourceCardId)
  ) {
    return { ok: false, reason: "Trusted settings auth card assignment does not match the requested resource." };
  }

  if (hasText(payload.expiresAt)) {
    const now = Date.parse(input.now ?? new Date().toISOString());
    const expiresAt = Date.parse(payload.expiresAt);

    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      return { ok: false, reason: "Trusted settings auth session is expired." };
    }
  }

  const claims: TrustedSettingsAuthClaims = {
    actorId: payload.actorId.trim(),
    displayName: payload.displayName.trim(),
    role: role as SettingsActorRole,
    tenantId: payload.tenantId.trim(),
    ...(cardIds ? { cardIds } : {}),
    ...(hasText(payload.expiresAt) ? { expiresAt: payload.expiresAt } : {}),
    ...(hasText(payload.issuedAt) ? { issuedAt: payload.issuedAt } : {})
  };

  return {
    claims,
    ok: true
  };
}

export function createSettingsAuthorizationContextFromClaims(input: {
  readonly claims: TrustedSettingsAuthClaims;
  readonly ipAddress?: string | undefined;
  readonly userAgent?: string | undefined;
}): SettingsAuthorizationContext {
  return {
    actorId: input.claims.actorId,
    displayName: input.claims.displayName,
    role: input.claims.role,
    tenantId: input.claims.tenantId,
    ...(input.claims.cardIds ? { cardIds: input.claims.cardIds } : {}),
    ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
    ...(input.userAgent ? { userAgent: input.userAgent } : {})
  };
}
