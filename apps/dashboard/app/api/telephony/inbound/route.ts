import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import { normalizeInboundWebhook } from "@bidayax/telephony";

type InsertedCallRow = {
  readonly id: string;
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
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = new Pool(config);

  return pool;
}

function logTelephonyRouteEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "dashboard-telephony-inbound-route",
      event,
      ...details
    })
  );
}

export async function POST(request: Request) {
  const database = getDatabasePool();

  if (!database) {
    logTelephonyRouteEvent("warn", "provider_config_missing", {
      reason: "database_url_not_configured"
    });

    return NextResponse.json(
      {
        error: "Telephony preparation storage is not configured."
      },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const normalized = normalizeInboundWebhook(payload);

    const callResult = await database.query<InsertedCallRow>(
      `
        insert into telephony_calls (
          provider,
          provider_call_id,
          direction,
          from_number,
          to_number,
          executive_slug,
          status,
          language,
          dialect
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning id::text
      `,
      [
        normalized.provider,
        normalized.providerCallId,
        normalized.direction,
        normalized.fromNumber,
        normalized.toNumber,
        normalized.executiveSlug,
        normalized.status,
        normalized.language,
        normalized.dialect
      ]
    );
    const callId = callResult.rows[0]?.id;

    if (!callId) {
      throw new Error("Call insert failed.");
    }

    await database.query(
      `
        insert into telephony_call_events (call_id, event_type, payload)
        values ($1::uuid, $2, $3::jsonb), ($1::uuid, $4, $5::jsonb)
      `,
      [
        callId,
        "call_received",
        JSON.stringify({ provider: normalized.provider }),
        "call_validated",
        JSON.stringify({ normalized: true })
      ]
    );

    logTelephonyRouteEvent("info", "call_record_created", {
      provider: normalized.provider
    });
    logTelephonyRouteEvent("info", "call_lifecycle_event_created", {
      count: 2
    });

    return NextResponse.json({
      callId,
      ok: true,
      provider: normalized.provider,
      status: normalized.status
    });
  } catch {
    logTelephonyRouteEvent("warn", "inbound_webhook_rejected");

    return NextResponse.json(
      {
        error: "Invalid telephony webhook payload."
      },
      { status: 400 }
    );
  }
}
