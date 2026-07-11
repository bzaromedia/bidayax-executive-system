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
  settingsApiSuccess
} from "@bidayax/settings";
import type { BrandThemeConfig } from "@bidayax/types";
import { readTrustedSettingsAuthContext } from "./settings-auth-context";

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

type SettingsApiOutcome =
  | "authentication_failure"
  | "authorization_failure"
  | "persistence_failure"
  | "success"
  | "validation_failure";

type SettingsApiAction = "read" | "write";

function authErrorCodeForStatus(status: 401 | 403) {
  return status === 401 ? "unauthenticated" : "authorization_failed";
}

function logSettingsApiOutcome(input: {
  readonly action: SettingsApiAction;
  readonly errorCode?: string | undefined;
  readonly kind: SettingsKind;
  readonly level?: "info" | "warning" | "error" | undefined;
  readonly message: string;
  readonly outcome: SettingsApiOutcome;
  readonly persistenceMode?: RoutePersistenceStatus["mode"] | undefined;
  readonly requestId: string;
  readonly slug: string;
  readonly status: number;
  readonly tenantId?: string | undefined;
}) {
  const logEvent = createSettingsLogEvent({
    event: "settings_api_request_outcome",
    level:
      input.level ??
      (input.outcome === "success" ? "info" : input.outcome === "persistence_failure" ? "error" : "warning"),
    message: input.message,
    metadata: {
      action: input.action,
      errorCode: input.errorCode,
      kind: input.kind,
      outcome: input.outcome,
      persistenceMode: input.persistenceMode,
      requestId: input.requestId,
      slug: input.slug,
      status: input.status,
      tenantId: input.tenantId
    }
  });

  console.info(
    JSON.stringify({
      component: "settings-api-route",
      event: logEvent.event,
      level: logEvent.level,
      message: logEvent.message,
      metadata: logEvent.metadata,
      occurredAt: logEvent.occurredAt,
      requestId: input.requestId
    })
  );

  return logEvent;
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
    logSettingsApiOutcome({
      action: "read",
      errorCode: "invalid_payload",
      kind,
      message: "Settings slug is invalid.",
      outcome: "validation_failure",
      requestId,
      slug,
      status: 400
    });

    return NextResponse.json(
      settingsApiError("invalid_payload", "Settings slug is invalid.", requestId),
      { status: 400 }
    );
  }

  const value = defaultValueForKind(slug, kind);

  if (!value) {
    logSettingsApiOutcome({
      action: "read",
      errorCode: "not_found",
      kind,
      message: "Settings were not found for this card.",
      outcome: "validation_failure",
      requestId,
      slug,
      status: 404
    });

    return NextResponse.json(
      settingsApiError("not_found", "Settings were not found for this card.", requestId),
      { status: 404 }
    );
  }

  const tenantId = getTenantId(slug);
  const authContext = readTrustedSettingsAuthContext({
    request,
    resourceCardId: slug,
    resourceTenantId: tenantId
  });

  if (!authContext.ok) {
    const errorCode = authErrorCodeForStatus(authContext.status);
    logSettingsApiOutcome({
      action: "read",
      errorCode,
      kind,
      message: authContext.reason,
      outcome: authContext.status === 401 ? "authentication_failure" : "authorization_failure",
      requestId,
      slug,
      status: authContext.status,
      tenantId
    });

    return NextResponse.json(
      settingsApiError(errorCode, authContext.reason, requestId),
      { status: authContext.status }
    );
  }

  const context = authContext.context;
  const authorization = authorizeSettingsAction({
    context,
    permission: "settings:read",
    resource: {
      cardId: slug,
      tenantId
    }
  });

  if (!authorization.allowed) {
    logSettingsApiOutcome({
      action: "read",
      errorCode: "authorization_failed",
      kind,
      message: authorization.reason,
      outcome: "authorization_failure",
      requestId,
      slug,
      status: 403,
      tenantId: context.tenantId
    });

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

  logSettingsApiOutcome({
    action: "read",
    kind,
    message: "Settings API request completed successfully.",
    outcome: "success",
    persistenceMode: persistence.mode,
    requestId,
    slug,
    status: 200,
    tenantId: context.tenantId
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
    logSettingsApiOutcome({
      action: "write",
      errorCode: "invalid_payload",
      kind,
      message: "Settings slug is invalid.",
      outcome: "validation_failure",
      requestId,
      slug,
      status: 400
    });

    return NextResponse.json(
      settingsApiError("invalid_payload", "Settings slug is invalid.", requestId),
      { status: 400 }
    );
  }

  const currentValue = defaultValueForKind(slug, kind);

  if (!currentValue) {
    logSettingsApiOutcome({
      action: "write",
      errorCode: "not_found",
      kind,
      message: "Settings were not found for this card.",
      outcome: "validation_failure",
      requestId,
      slug,
      status: 404
    });

    return NextResponse.json(
      settingsApiError("not_found", "Settings were not found for this card.", requestId),
      { status: 404 }
    );
  }

  const tenantId = getTenantId(slug);
  const authContext = readTrustedSettingsAuthContext({
    request,
    resourceCardId: slug,
    resourceTenantId: tenantId
  });

  if (!authContext.ok) {
    const errorCode = authErrorCodeForStatus(authContext.status);
    logSettingsApiOutcome({
      action: "write",
      errorCode,
      kind,
      message: authContext.reason,
      outcome: authContext.status === 401 ? "authentication_failure" : "authorization_failure",
      requestId,
      slug,
      status: authContext.status,
      tenantId
    });

    return NextResponse.json(
      settingsApiError(errorCode, authContext.reason, requestId),
      { status: authContext.status }
    );
  }

  const context = authContext.context;
  const authorization = authorizeSettingsAction({
    context,
    permission: kind === "card-customization" ? "settings:update" : "settings:preview",
    resource: {
      cardId: slug,
      tenantId
    }
  });

  if (!authorization.allowed) {
    const logEvent = logSettingsApiOutcome({
      action: "write",
      errorCode: "authorization_failed",
      kind,
      message: authorization.reason,
      outcome: "authorization_failure",
      requestId,
      slug,
      status: 403,
      tenantId: context.tenantId
    });

    return NextResponse.json(
      settingsApiError("authorization_failed", logEvent.message, requestId),
      { status: 403 }
    );
  }

  const persistence = persistenceStatusForWrite();

  if (!persistence.configured) {
    logSettingsApiOutcome({
      action: "write",
      errorCode: "database_unconfigured",
      kind,
      message: persistence.warning ?? "Database persistence is not configured.",
      outcome: "persistence_failure",
      persistenceMode: persistence.mode,
      requestId,
      slug,
      status: 503,
      tenantId: context.tenantId
    });

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
    logSettingsApiOutcome({
      action: "write",
      errorCode: "invalid_payload",
      kind,
      message: "Settings payload did not match the required schema.",
      outcome: "validation_failure",
      requestId,
      slug,
      status: 400,
      tenantId: context.tenantId
    });

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
      logSettingsApiOutcome({
        action: "write",
        errorCode: "invalid_payload",
        kind,
        message: "Theme settings failed validation.",
        outcome: "validation_failure",
        requestId,
        slug,
        status: 400,
        tenantId: context.tenantId
      });

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

  let persisted = false;

  try {
    persisted = await writeAuditEvent(auditEvent);
  } catch {
    logSettingsApiOutcome({
      action: "write",
      errorCode: "persistence_failed",
      kind,
      message: "Settings audit event persistence failed.",
      outcome: "persistence_failure",
      persistenceMode: persistence.mode,
      requestId,
      slug,
      status: 503,
      tenantId: context.tenantId
    });

    return NextResponse.json(
      settingsApiError("database_unconfigured", "Settings persistence failed.", requestId),
      { status: 503 }
    );
  }

  logSettingsApiOutcome({
    action: "write",
    kind,
    message: "Settings API request accepted successfully.",
    outcome: "success",
    persistenceMode: persistence.mode,
    requestId,
    slug,
    status: 202,
    tenantId: context.tenantId
  });

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
