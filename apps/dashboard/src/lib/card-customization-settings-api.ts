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
import type { BrandThemeConfig } from "@bidayax/types";

export type SettingsKind = "card-customization" | "qr-feedback" | "receptionist" | "theme";

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

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function writeAuditEvent(event: ReturnType<typeof createCustomizationAuditEvent>) {
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

export function getSettingsPayload(slug: string, kind: SettingsKind) {
  const value = defaultValueForKind(slug, kind);

  if (!value) {
    return NextResponse.json(
      {
        error: "settings_not_found",
        ok: false
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: value,
    kind,
    ok: true,
    slug
  });
}

export async function postSettingsPayload(
  request: Request,
  slug: string,
  kind: SettingsKind
) {
  const currentValue = defaultValueForKind(slug, kind);

  if (!currentValue) {
    return NextResponse.json(
      {
        error: "settings_not_found",
        ok: false
      },
      { status: 404 }
    );
  }

  const body = await parseJson(request);
  const schema = schemaForKind(kind);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_settings_payload",
        ok: false
      },
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
          error: "invalid_theme",
          issues: themeValidation.issues,
          ok: false
        },
        { status: 400 }
      );
    }
  }

  const auditEvent = createCustomizationAuditEvent({
    actor: "dashboard-settings",
    affectedCard: slug,
    newValue: parsed.data,
    oldValue: currentValue,
    settingType: kind
  });
  const persisted = await writeAuditEvent(auditEvent);

  return NextResponse.json(
    {
      audit: {
        eventId: auditEvent.auditEventId,
        persisted
      },
      data: parsed.data,
      kind,
      ok: true,
      slug
    },
    { status: 202 }
  );
}

