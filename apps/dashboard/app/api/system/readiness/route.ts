import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  checkInMemoryRateLimit,
  createLogger,
  isOriginAllowed,
  validateEnvironmentConfig
} from "@bidayax/config";
import {
  evaluateProductionVoiceSafety,
  getLiveProviderRuntimeConfig,
  getProviderReadinessChecks
} from "@bidayax/telephony";
import {
  createTelemetryEvent,
  createTelemetryMetric,
  createTelemetrySafetyGateEvent,
  writeTelemetryEvent,
  writeTelemetryMetric,
  writeTelemetrySafetyGateEvent
} from "@bidayax/telemetry";

type MigrationRow = {
  readonly table_name: string;
};

const requiredTables = [
  "interaction_events",
  "intent_scores",
  "contact_graph_nodes",
  "contact_graph_edges",
  "contact_graph_snapshots",
  "receptionist_interactions",
  "receptionist_tasks",
  "receptionist_conversation_turns",
  "receptionist_workflow_events",
  "telephony_calls",
  "telephony_call_events",
  "voice_sessions",
  "outbound_call_requests",
  "provider_readiness_checks",
  "voice_runtime_sessions"
] as const;

let pool: Pool | null = null;

const log = createLogger({ component: "system-readiness-route" });

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

async function checkDatabaseReadiness() {
  const database = getDatabasePool();

  if (!database) {
    return {
      missingTables: [...requiredTables],
      status: "not_ready" as const
    };
  }

  const result = await database.query<MigrationRow>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [[...requiredTables]]
  );
  const presentTables = new Set(result.rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !presentTables.has(table));

  return {
    missingTables,
    status: missingTables.length === 0 ? ("ready" as const) : ("degraded" as const)
  };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const rateLimit = checkInMemoryRateLimit({
    key: "system-readiness",
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Readiness checks are rate limited.",
        resetAt: rateLimit.resetAt,
        status: "degraded"
      },
      { status: 429 }
    );
  }

  if (!isOriginAllowed({ origin: request.headers.get("origin") })) {
    return NextResponse.json(
      {
        error: "Origin is not allowed.",
        status: "not_ready"
      },
      { status: 403 }
    );
  }

  const envValidation = validateEnvironmentConfig();
  const providerConfig = getLiveProviderRuntimeConfig();
  const providerChecks = getProviderReadinessChecks(providerConfig);
  const voiceSafety = evaluateProductionVoiceSafety(providerConfig);

  try {
    const database = await checkDatabaseReadiness();
    const notReady =
      envValidation.status === "failed" ||
      database.status === "not_ready" ||
      database.missingTables.length > 0;

    log("info", "readiness_check_completed", {
      databaseStatus: database.status,
      environmentStatus: envValidation.status,
      providerCheckCount: providerChecks.length,
      voiceAllowed: voiceSafety.allowed
    });

    if (getDatabasePool()) {
      const telemetryDatabase = getDatabasePool();

      if (telemetryDatabase) {
        await Promise.all([
          writeTelemetryEvent(
            telemetryDatabase,
            createTelemetryEvent({
              durationMs: Math.round(Date.now() - startedAt),
              eventName: "api_request_completed",
              metadata: {
                route: "/api/system/readiness"
              },
              severity: notReady ? "warning" : "info",
              status: notReady ? "degraded" : "success",
              subsystem: "system"
            })
          ),
          writeTelemetryMetric(
            telemetryDatabase,
            createTelemetryMetric({
              dimensions: {
                route: "/api/system/readiness"
              },
              metricName: "api_latency_ms",
              metricUnit: "milliseconds",
              metricValue: Math.round(Date.now() - startedAt),
              subsystem: "system"
            })
          ),
          writeTelemetrySafetyGateEvent(
            telemetryDatabase,
            createTelemetrySafetyGateEvent({
              decision: voiceSafety.allowed ? "allowed" : "blocked",
              gateName: "production_voice",
              metadata: {
                route: "/api/system/readiness"
              },
              reasonCodes: voiceSafety.reasonCodes,
              subsystem: "telephony"
            })
          )
        ]).catch(() => undefined);
      }
    }

    return NextResponse.json({
      checks: {
        database,
        environment: {
          errors: envValidation.errors,
          status: envValidation.status,
          warnings: envValidation.warnings
        },
        provider: providerChecks,
        voiceSafety
      },
      status: notReady ? "not_ready" : "healthy",
      timestamp: new Date().toISOString()
    });
  } catch {
    log("error", "readiness_check_failed");

    return NextResponse.json(
      {
        error: "Readiness check failed safely.",
        status: "not_ready",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
