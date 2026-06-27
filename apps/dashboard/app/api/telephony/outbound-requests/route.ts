import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  createOutboundCallRequest,
  getTelephonyRuntimeConfig
} from "@bidayax/telephony";
import { isExecutiveSlug } from "@bidayax/types";

type OutboundRequestBody = {
  readonly requestedBy?: unknown;
  readonly toNumber?: unknown;
  readonly executiveSlug?: unknown;
  readonly reason?: unknown;
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
      component: "dashboard-telephony-outbound-route",
      event,
      ...details
    })
  );
}

function parseOutboundRequestBody(body: OutboundRequestBody) {
  if (
    typeof body.requestedBy !== "string" ||
    typeof body.toNumber !== "string" ||
    typeof body.executiveSlug !== "string" ||
    typeof body.reason !== "string" ||
    !isExecutiveSlug(body.executiveSlug)
  ) {
    return null;
  }

  return {
    executiveSlug: body.executiveSlug,
    reason: body.reason,
    requestedBy: body.requestedBy,
    toNumber: body.toNumber
  };
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
    const body = (await request.json()) as OutboundRequestBody;
    const input = parseOutboundRequestBody(body);

    if (!input) {
      logTelephonyRouteEvent("warn", "validation_failure");

      return NextResponse.json(
        {
          error: "Invalid outbound call request."
        },
        { status: 400 }
      );
    }

    const prepared = createOutboundCallRequest(
      input,
      getTelephonyRuntimeConfig()
    );

    await database.query(
      `
        insert into outbound_call_requests (
          requested_by,
          to_number,
          executive_slug,
          reason,
          approval_status,
          status
        )
        values ($1, $2, $3, $4, $5, $6)
      `,
      [
        prepared.requestedBy,
        prepared.toNumber,
        prepared.executiveSlug,
        prepared.reason,
        prepared.approvalStatus,
        prepared.status
      ]
    );

    logTelephonyRouteEvent("info", "outbound_request_created");

    if (prepared.safetyReasons.length > 0) {
      logTelephonyRouteEvent("info", "outbound_request_blocked", {
        reasonCount: prepared.safetyReasons.length
      });
    }

    return NextResponse.json({
      approvalStatus: prepared.approvalStatus,
      ok: true,
      safetyReasons: prepared.safetyReasons,
      status: prepared.status
    });
  } catch {
    logTelephonyRouteEvent("error", "outbound_request_failed");

    return NextResponse.json(
      {
        error: "Outbound call request could not be created."
      },
      { status: 500 }
    );
  }
}
