import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  getLiveProviderRuntimeConfig,
  prepareVoiceRuntimeReadiness
} from "@bidayax/telephony";

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

function logVoiceRuntimeRouteEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "live-provider-voice-runtime-route",
      event,
      ...details
    })
  );
}

export async function POST() {
  const config = getLiveProviderRuntimeConfig();
  const readiness = prepareVoiceRuntimeReadiness(config);
  const database = getDatabasePool();

  if (!database) {
    logVoiceRuntimeRouteEvent("warn", "provider_config_missing", {
      reason: "database_url_not_configured"
    });

    return NextResponse.json(
      {
        error: "Voice runtime readiness storage is not configured.",
        readiness
      },
      { status: 503 }
    );
  }

  try {
    const result = await database.query<{ readonly id: string }>(
      `
        insert into voice_runtime_sessions (
          provider,
          runtime_model,
          status,
          test_mode,
          safety_gate_status,
          transcript_status,
          summary_status
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id::text
      `,
      [
        readiness.provider,
        readiness.runtimeModel,
        readiness.status,
        readiness.testMode,
        readiness.safetyGateStatus,
        readiness.transcriptStatus,
        readiness.summaryStatus
      ]
    );

    logVoiceRuntimeRouteEvent("info", "voice_session_prepared", {
      status: readiness.status
    });

    return NextResponse.json({
      id: result.rows[0]?.id,
      readiness
    });
  } catch {
    logVoiceRuntimeRouteEvent("error", "voice_runtime_storage_failed");

    return NextResponse.json(
      {
        error: "Voice runtime readiness could not be stored."
      },
      { status: 500 }
    );
  }
}

