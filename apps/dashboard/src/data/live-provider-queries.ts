import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  getLiveProviderRuntimeConfig,
  getProviderReadinessChecks,
  prepareVoiceRuntimeReadiness
} from "@bidayax/telephony";
import type {
  DashboardLiveProviderReadinessData,
  DashboardLiveProviderSummary,
  DashboardStatus,
  ProviderReadinessCheck
} from "@bidayax/types";

type ReadinessRow = {
  readonly provider: string;
  readonly check_name: string;
  readonly status: string;
  readonly details: string;
  readonly checked_at: Date;
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

function logLiveProviderDashboardEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "live-provider-readiness-dashboard",
      event,
      ...details
    })
  );
}

function createSummary(): DashboardLiveProviderSummary {
  const config = getLiveProviderRuntimeConfig();
  const voiceRuntime = prepareVoiceRuntimeReadiness(config);

  return {
    allowProductionCalls: config.allowProductionCalls,
    blockedReasonCodes: voiceRuntime.reasonCodes,
    lastCheckedAt: new Date().toISOString(),
    liveInboundCallsEnabled: config.liveInboundCallsEnabled,
    openAiRealtimeConfigured: Boolean(
      config.openAiApiKey && config.openAiRealtimeModel
    ),
    outboundCallsEnabled: config.outboundCallsEnabled,
    productionVoiceAllowed: voiceRuntime.status === "configured",
    providerMode: config.telephonyProvider,
    requireHumanApproval: config.requireHumanApproval,
    twilioConfigured: Boolean(
      config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber
    ),
    voiceAgentEnabled: config.voiceAgentEnabled,
    voiceRuntimeProvider: config.voiceRuntimeProvider,
    voiceTestMode: config.voiceTestMode
  };
}

function emptyLiveProviderData(
  status: DashboardStatus,
  statusMessage: string
): DashboardLiveProviderReadinessData {
  const config = getLiveProviderRuntimeConfig();

  return {
    readinessChecks: getProviderReadinessChecks(config),
    status,
    statusMessage,
    summary: createSummary(),
    voiceRuntime: prepareVoiceRuntimeReadiness(config)
  };
}

function normalizeReadinessRows(
  rows: readonly ReadinessRow[]
): readonly ProviderReadinessCheck[] {
  return rows.flatMap((row) => {
    if (
      (row.provider !== "mock" &&
        row.provider !== "twilio" &&
        row.provider !== "openai_realtime") ||
      (row.status !== "passed" &&
        row.status !== "failed" &&
        row.status !== "warning" &&
        row.status !== "skipped")
    ) {
      logLiveProviderDashboardEvent("warn", "invalid_readiness_data");
      return [];
    }

    return [
      {
        checkedAt: row.checked_at.toISOString(),
        checkName: row.check_name,
        details: row.details,
        provider: row.provider,
        status: row.status
      }
    ];
  });
}

export async function getLiveProviderDashboardData(): Promise<DashboardLiveProviderReadinessData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyLiveProviderData(
      "not_configured",
      "DATABASE_URL is not configured. Live provider readiness is evaluated from safe environment defaults only."
    );
  }

  try {
    const result = await database.query<ReadinessRow>(
      `
        select distinct on (provider, check_name)
          provider,
          check_name,
          status,
          details,
          checked_at
        from provider_readiness_checks
        order by provider, check_name, checked_at desc
      `
    );

    logLiveProviderDashboardEvent("info", "readiness_query_success", {
      checkCount: result.rowCount
    });

    const fallback = emptyLiveProviderData(
      "ready",
      "Showing Phase 10 live provider readiness and voice safety gates."
    );

    return {
      ...fallback,
      readinessChecks:
        result.rows.length > 0
          ? normalizeReadinessRows(result.rows)
          : fallback.readinessChecks
    };
  } catch {
    logLiveProviderDashboardEvent("error", "readiness_query_failure");

    return emptyLiveProviderData(
      "query_failed",
      "Live provider readiness queries failed. Run the Phase 10 migration before viewing stored readiness records."
    );
  }
}
