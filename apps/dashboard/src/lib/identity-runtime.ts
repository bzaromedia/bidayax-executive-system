import { Pool, type PoolClient, type PoolConfig } from "pg";
import {
  assertDevelopmentIdentityAllowed,
  createIdentityRepository,
  parseCookie,
  readIdentityEnvironment,
  resolveApplicationSession,
  rolePermissionPolicy,
  applicationSessionCookieName,
  type IdentityEnvironment,
  type IdentityQueryExecutor,
  type IdentityRepository
} from "@bidayax/identity";
import type {
  TenantMembershipRole,
  TrustedSettingsAuthorizationContext
} from "@bidayax/types";

let pool: Pool | null = null;

function poolConfig(): PoolConfig | null {
  if (!process.env.DATABASE_URL) return null;
  return {
    connectionString: process.env.DATABASE_URL,
    max: Number.parseInt(process.env.PG_POOL_MAX ?? "5", 10),
    ...(process.env.DATABASE_SSL === "true"
      ? { ssl: { rejectUnauthorized: false } }
      : {})
  };
}

export function getIdentityPool(): Pool | null {
  if (pool) return pool;
  const config = poolConfig();
  if (!config) return null;
  pool = new Pool(config);
  return pool;
}

export function getIdentityEnvironment(): IdentityEnvironment | null {
  const result = readIdentityEnvironment();
  return result.configured ? result.value : null;
}

export async function withIdentityTransaction<T>(
  operation: (repository: IdentityRepository, client: PoolClient) => Promise<T>
): Promise<T> {
  const database = getIdentityPool();
  if (!database) throw new Error("DATABASE_URL is required for identity persistence.");
  const client = await database.connect();
  await client.query("begin");
  try {
    const result = await operation(
      createIdentityRepository(client as IdentityQueryExecutor),
      client
    );
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function developmentContext(cardId: string, tenantId: string): TrustedSettingsAuthorizationContext {
  assertDevelopmentIdentityAllowed();
  const configuredTenant = process.env.IDENTITY_DEVELOPMENT_TENANT_ID ?? "bidayax-llc";
  if (configuredTenant !== tenantId) {
    throw new Error("Development identity tenant does not match the resource tenant.");
  }
  const role = (process.env.IDENTITY_DEVELOPMENT_ROLE ?? "tenant_owner") as TenantMembershipRole;
  if (!(role in rolePermissionPolicy)) {
    throw new Error("Development identity role is invalid.");
  }
  const now = new Date().toISOString();
  return {
    auditActor: {
      actorId: "test-identity-local",
      actorType: role === "tenant_owner" || role === "tenant_admin" ? "admin" : "user",
      displayName: "Local Test Identity"
    },
    authenticationMethod: "explicit_development_simulation",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    issuedAt: now,
    permissions: rolePermissionPolicy[role],
    permittedCardIds:
      role === "tenant_owner" || role === "tenant_admin" ? [] : [cardId],
    provider: "workos",
    role,
    sessionId: "test-session-local",
    tenantId,
    userId: "test-identity-local"
  };
}

export async function resolveRequestApplicationSession(request: Request) {
  const environmentResult = readIdentityEnvironment();
  if (!environmentResult.configured) {
    return {
      ok: false as const,
      reason: "Production identity configuration is unavailable.",
      status: 503 as const
    };
  }
  const database = getIdentityPool();
  if (!database) {
    return {
      ok: false as const,
      reason: "Identity persistence is unavailable.",
      status: 503 as const
    };
  }
  const repository = createIdentityRepository(database as IdentityQueryExecutor);
  const sessionToken = parseCookie(
    request.headers.get("cookie"),
    applicationSessionCookieName
  );
  const resolution = await resolveApplicationSession({
    environment: environmentResult.value,
    repository,
    sessionToken
  });
  if (!resolution.ok) {
    return {
      ok: false as const,
      reason: resolution.reason,
      status:
        resolution.code === "disabled_identity" ||
        resolution.code === "revoked_membership" ||
        resolution.code === "ambiguous_membership"
          ? 403 as const
          : 401 as const
    };
  }
  return {
    context: resolution.context,
    environment: environmentResult.value,
    ok: true as const,
    repository,
    session: resolution.session
  };
}
export type DashboardIdentityResult =
  | {
      readonly ok: true;
      readonly context: TrustedSettingsAuthorizationContext;
      readonly repository: IdentityRepository | null;
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly status: 401 | 403 | 503;
    };

export async function resolveDashboardIdentity(input: {
  readonly request: Request;
  readonly resourceCardId: string;
  readonly resourceTenantId: string;
}): Promise<DashboardIdentityResult> {
  if (
    process.env.IDENTITY_DEVELOPMENT_MODE === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    try {
      return {
        context: developmentContext(input.resourceCardId, input.resourceTenantId),
        ok: true,
        repository: null
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : "Development identity denied.",
        status: 403
      };
    }
  }

  const environmentResult = readIdentityEnvironment();
  if (!environmentResult.configured) {
    return {
      ok: false,
      reason: "Production identity configuration is unavailable.",
      status: 503
    };
  }

  const database = getIdentityPool();
  if (!database) {
    return {
      ok: false,
      reason: "Identity persistence is unavailable.",
      status: 503
    };
  }

  const repository = createIdentityRepository(database as IdentityQueryExecutor);
  const sessionToken = parseCookie(
    input.request.headers.get("cookie"),
    applicationSessionCookieName
  );
  const resolution = await resolveApplicationSession({
    environment: environmentResult.value,
    repository,
    sessionToken
  });

  if (!resolution.ok) {
    return {
      ok: false,
      reason: resolution.reason,
      status: resolution.code === "disabled_identity" ||
        resolution.code === "revoked_membership" ||
        resolution.code === "ambiguous_membership"
        ? 403
        : 401
    };
  }

  if (resolution.context.tenantId !== input.resourceTenantId) {
    return {
      ok: false,
      reason: "Authenticated tenant does not own the requested resource.",
      status: 403
    };
  }

  const privileged =
    resolution.context.role === "tenant_owner" ||
    resolution.context.role === "tenant_admin";
  if (
    !privileged &&
    !resolution.context.permittedCardIds.includes(input.resourceCardId)
  ) {
    return {
      ok: false,
      reason: "Authenticated user is not assigned to the requested card.",
      status: 403
    };
  }

  return {
    context: resolution.context,
    ok: true,
    repository
  };
}
