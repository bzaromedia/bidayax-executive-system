import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  brandThemeConfigSchema,
  createCustomizationAuditEvent,
  customerCardSettingsSchema,
  getDefaultCustomerCardSettings,
  qrTransferFeedbackConfigSchema,
  receptionistSettingsConfigSchema,
  validateBrandThemeConfig
} from "@bidayax/card-customization";
import {
  assertValidSettingsSlug,
  authorizeSettingsAction,
  createSettingsLogEvent,
  createSettingsMetric,
  createSettingsRequestId,
  makeSettingsCacheKey,
  settingsApiError,
  settingsApiSuccess,
  type SettingsActorRole,
  type SettingsAuthorizationContext
} from "@bidayax/settings";
import type { BrandThemeConfig } from "@bidayax/types";

export type SettingsKind = "card-customization" | "qr-feedback" | "receptionist" | "theme";

type CustomizationAuditEvent = ReturnType<typeof createCustomizationAuditEvent>;

type RoutePersistenceStatus = {
  readonly configured: boolean;
  readonly mode: "persisted_audit" | "fallback_defaults" | "unavailable_for_write";
  readonly warning: string | null;
};

let pool: Pool | null = null;

function getDatabasePool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  const config: PoolConfig = {
    connectionString,
    max: Number.parseInt(process.env.PG_POOL_MAX ?? "5", 10)
  };

  if (process.env.DATABASE_SSL === "true") {
    config.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(config);

  return pool;
}

function schemaForKind(kind: SettingsKind) {
  if (kind === "card-customization") {
    return customerCardSettingsSchema;
  }

  if (kind === "receptionist") {
    return receptionistSettingsConfigSchema;
  }

  if (kind === "theme") {
    return brandThemeConfigSchema;
  }

  return qrTransferFeedbackConfigSchema;
}

function defaultValueForKind(slug: string, kind: SettingsKind) {
  const settings = getDefaultCustomerCardSettings(slug);

  if (!settings) {
    return null;
  }

  if (kind === "card-customization") {
    return settings;
  }

  if (kind === "receptionist") {
    return settings.receptionist;
  }

  if (kind === "theme") {
    return settings.brandTheme;
  }

  return settings.qrFeedback;
}

function getTenantId(slug: string): string {
  const settings = getDefaultCustomerCardSettings(slug);

  return settings?.brandTheme.ownerId ?? "tenant-bidayax";
}

function getActorRole(request: Request): SettingsActorRole {
  const role = request.headers.get("x-settings-role") ??
    (process.env.NODE_ENV === "production" ? "viewer" : "administrator");

  if (["administrator", "executive", "viewer", "system"].includes(role)) {
    return role as SettingsActorRole;
  }

  return "viewer";
}

function getAuthorizationContext(
  request: Request,
  slug: string
): SettingsAuthorizationContext {
  const tenantId = request.headers.get("x-tenant-id") ?? getTenantId(slug);
  const actorId = request.headers.get("x-actor-id") ?? "dashboard-settings";
  const displayName = request.headers.get("x-actor-name") ?? "Dashboard Settings";
  const assignedCards = request.headers.get("x-card-ids")
    ?.split(",")
    .map((cardId) => cardId.trim())
    .filter(Boolean);

  return {
    actorId,
    cardIds: assignedCards ?? [slug],
    displayName,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    role: getActorRole(request),
    tenantId,
    userAgent: request.headers.get("user-agent") ?? undefined
  };
}

function persistenceStatusForRead(): RoutePersistenceStatus {
  return getDatabasePool()
    ? {
        configured: true,
        mode: "persisted_audit",
        warning: "Phase 4 reads include tenant-aware API metadata; published settings persistence remains backed by the Phase 3 repository layer."
      }
    : {
        configured: false,
        mode: "fallback_defaults",
        warning: "DATABASE_URL is not configured, so the dashboard is rendering source-of-truth default settings and cannot persist writes."
      };
}

function persistenceStatusForWrite(): RoutePersistenceStatus {
  return getDatabasePool()
    ? {
        configured: true,
        mode: "persisted_audit",
        warning: null
      }
    : {
        configured: false,
        mode: "unavailable_for_write",
        warning: "DATABASE_URL is required before settings changes can be persisted."
      };
}

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function writeAuditEvent(event: CustomizationAuditEvent) {
  const database = getDatabasePool();

  if (!database) {
    return false;
  }

  await database.query(
    `
      insert into customization_audit_events (
        audit_event_id,
        setting_type,
        old_value_hash,
        new_value_hash,
        actor,
        affected_card,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (audit_event_id) do nothing
    `,
    [
      event.auditEventId,
      event.settingType,
      event.oldValueHash,
      event.newValueHash,
      event.actor,
      event.affectedCard,
      event.timestamp
    ]
  );

  return true;
}

export function getSettingsPayload(
  request: Request,
  slug: string,
  kind: SettingsKind
) {
  const requestId = createSettingsRequestId(`${kind}-${slug}`);

  try {
    assertValidSettingsSlug(slug);
  } catch {
    return NextResponse.json(
      settingsApiError("invalid_payload", "Settings slug is invalid.", requestId),
      { status: 400 }
    );
  }

  const value = defaultValueForKind(slug, kind);

  if (!value) {
    return NextResponse.json(
      settingsApiError("not_found", "Settings were not found for this card.", requestId),
      { status: 404 }
    );
  }

  const context = getAuthorizationContext(request, slug);
  const authorization = authorizeSettingsAction({
    context,
    permission: "settings:read",
    resource: {
      cardId: slug,
      tenantId: getTenantId(slug)
    }
  });

  if (!authorization.allowed) {
    return NextResponse.json(
      settingsApiError("authorization_failed", authorization.reason, requestId),
      { status: 403 }
    );
  }

  const cacheKey = makeSettingsCacheKey({
    cardId: slug,
    kind: kind === "theme" ? "brand-tokens" : "published-card",
    tenantId: context.tenantId
  });
  const persistence = persistenceStatusForRead();
  const metric = createSettingsMetric({
    cardId: slug,
    name: "settings_api_request",
    tags: {
      action: "read",
      kind,
      persistence: persistence.mode
    },
    tenantId: context.tenantId,
    unit: "count",
    value: 1
  });

  return NextResponse.json(
    settingsApiSuccess({
      authorization,
      cache: {
        hit: false,
        key: cacheKey
      },
      data: {
        kind,
        metric,
        persistence,
        settings: value,
        slug,
        tenantId: context.tenantId
      },
      requestId
    })
  );
}

export async function postSettingsPayload(
  request: Request,
  slug: string,
  kind: SettingsKind
) {
  const requestId = createSettingsRequestId(`${kind}-${slug}-write`);

  try {
    assertValidSettingsSlug(slug);
  } catch {
    return NextResponse.json(
      settingsApiError("invalid_payload", "Settings slug is invalid.", requestId),
      { status: 400 }
    );
  }

  const currentValue = defaultValueForKind(slug, kind);

  if (!currentValue) {
    return NextResponse.json(
      settingsApiError("not_found", "Settings were not found for this card.", requestId),
      { status: 404 }
    );
  }

  const context = getAuthorizationContext(request, slug);
  const authorization = authorizeSettingsAction({
    context,
    permission: kind === "card-customization" ? "settings:update" : "settings:preview",
    resource: {
      cardId: slug,
      tenantId: getTenantId(slug)
    }
  });

  if (!authorization.allowed) {
    const logEvent = createSettingsLogEvent({
      event: "settings_authorization_failure",
      level: "warning",
      message: authorization.reason,
      metadata: {
        kind,
        slug
      }
    });

    return NextResponse.json(
      settingsApiError("authorization_failed", logEvent.message, requestId),
      { status: 403 }
    );
  }

  const persistence = persistenceStatusForWrite();

  if (!persistence.configured) {
    return NextResponse.json(
      settingsApiError(
        "database_unconfigured",
        persistence.warning ?? "Database persistence is not configured.",
        requestId
      ),
      { status: 503 }
    );
  }

  const body = await parseJson(request);
  const schema = schemaForKind(kind);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      settingsApiError("invalid_payload", "Settings payload did not match the required schema.", requestId),
      { status: 400 }
    );
  }

  if (kind === "theme") {
    const themeValidation = validateBrandThemeConfig(
      parsed.data as BrandThemeConfig
    );

    if (!themeValidation.valid) {
      return NextResponse.json(
        {
          ...settingsApiError("invalid_payload", "Theme settings failed validation.", requestId),
          issues: themeValidation.issues
        },
        { status: 400 }
      );
    }
  }

  const auditEvent = createCustomizationAuditEvent({
    actor: authorization.auditActor.actorId,
    affectedCard: slug,
    newValue: parsed.data,
    oldValue: currentValue,
    settingType: kind
  });
  const persisted = await writeAuditEvent(auditEvent);

  return NextResponse.json(
    settingsApiSuccess({
      audit: {
        persisted
      },
      authorization,
      data: {
        kind,
        persistence,
        settings: parsed.data,
        slug,
        tenantId: context.tenantId
      },
      requestId
    }),
    { status: 202 }
  );
}
