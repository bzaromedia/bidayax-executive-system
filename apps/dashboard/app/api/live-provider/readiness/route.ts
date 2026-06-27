import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  getLiveProviderRuntimeConfig,
  getProviderReadinessChecks,
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

function logReadinessRouteEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "live-provider-readiness-route",
      event,
      ...details
    })
  );
}

export async function GET() {
  const config = getLiveProviderRuntimeConfig();
  const checks = getProviderReadinessChecks(config);
  const voiceRuntime = prepareVoiceRuntimeReadiness(config);
  const database = getDatabasePool();

  logReadinessRouteEvent("info", "readiness_check_started");

  if (database) {
    try {
      await database.query(
        `
          insert into provider_readiness_checks (
            provider,
            check_name,
            status,
            details,
            checked_at
          )
          select *
          from jsonb_to_recordset($1::jsonb) as x(
            provider text,
            check_name text,
            status text,
            details text,
            checked_at timestamptz
          )
        `,
        [
          JSON.stringify(
            checks.map((check) => ({
              check_name: check.checkName,
              checked_at: check.checkedAt,
              details: check.details,
              provider: check.provider,
              status: check.status
            }))
          )
        ]
      );
    } catch {
      logReadinessRouteEvent("error", "readiness_storage_failed");
    }
  }

  logReadinessRouteEvent("info", "readiness_check_completed", {
    checkCount: checks.length
  });

  return NextResponse.json({
    checks,
    providerMode: config.telephonyProvider,
    voiceRuntime
  });
}

