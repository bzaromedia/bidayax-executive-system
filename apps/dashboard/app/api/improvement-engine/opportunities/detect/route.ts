import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  createSafeImprovementApiError,
  detectImprovementOpportunities,
  improvementApiErrorStatus,
  type TelemetryEvidenceSummary
} from "@bidayax/improvement-engine";
import {
  createTelemetryEvent,
  writeTelemetryEvent
} from "@bidayax/telemetry";

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

async function readTelemetryEvidence(database: Pool): Promise<TelemetryEvidenceSummary> {
  const result = await database.query<{
    readonly average_api_latency_ms: string | number | null;
    readonly api_request_count: string | number;
    readonly error_count: string | number;
    readonly safety_gate_block_count: string | number;
    readonly card_view_count: string | number;
    readonly card_action_count: string | number;
    readonly configuration_error_count: string | number;
    readonly telephony_readiness_failure_count: string | number;
  }>(
    `
      select
        coalesce((
          select avg(metric_value)
          from telemetry_metrics
          where metric_name in ('api_latency_ms', 'dashboard_query_duration_ms')
        ), 0) as average_api_latency_ms,
        (
          select count(*)::bigint
          from telemetry_events
          where event_name in ('api_request_completed', 'api_request_failed')
        ) as api_request_count,
        (select count(*)::bigint from telemetry_error_events) as error_count,
        (
          select count(*)::bigint
          from telemetry_safety_gate_events
          where decision = 'blocked'
        ) as safety_gate_block_count,
        (
          select count(*)::bigint
          from telemetry_events
          where event_name = 'interaction_event_created'
            and metadata->>'eventType' = 'card_view'
        ) as card_view_count,
        (
          select count(*)::bigint
          from telemetry_events
          where event_name = 'interaction_event_created'
            and metadata->>'eventType' in (
              'vcard_download',
              'call_click',
              'email_click',
              'website_click'
            )
        ) as card_action_count,
        (
          select count(*)::bigint
          from telemetry_error_events
          where error_category = 'configuration'
             or safe_message ilike '%configuration%'
             or safe_message ilike '%DATABASE_URL%'
        ) as configuration_error_count,
        (
          select count(*)::bigint
          from telemetry_events
          where event_name = 'telephony_readiness_checked'
            and status in ('blocked', 'failure', 'degraded')
        ) as telephony_readiness_failure_count
    `
  );
  const row = result.rows[0] ?? {
    api_request_count: 0,
    average_api_latency_ms: 0,
    card_action_count: 0,
    card_view_count: 0,
    configuration_error_count: 0,
    error_count: 0,
    safety_gate_block_count: 0,
    telephony_readiness_failure_count: 0
  };
  const numeric = (value: string | number | null) =>
    value === null ? 0 : typeof value === "number" ? value : Number.parseFloat(value);

  return {
    apiRequestCount: numeric(row.api_request_count),
    averageApiLatencyMs: numeric(row.average_api_latency_ms),
    cardActionCount: numeric(row.card_action_count),
    cardViewCount: numeric(row.card_view_count),
    configurationErrorCount: numeric(row.configuration_error_count),
    errorCount: numeric(row.error_count),
    safetyGateBlockCount: numeric(row.safety_gate_block_count),
    telephonyReadinessFailureCount: numeric(row.telephony_readiness_failure_count)
  };
}

export async function POST() {
  const database = getDatabasePool();

  if (!database) {
    return NextResponse.json(
      createSafeImprovementApiError({
        message: "DATABASE_URL is not configured.",
        status: improvementApiErrorStatus.notConfigured
      }),
      { status: 503 }
    );
  }

  try {
    const evidence = await readTelemetryEvidence(database);
    const opportunities = detectImprovementOpportunities(evidence);
    const inserted = [];

    for (const opportunity of opportunities) {
      const result = await database.query<{ readonly id: string }>(
        `
          insert into improvement_opportunities (
            subsystem,
            opportunity_type,
            evidence_summary,
            source_metric,
            baseline_value,
            severity,
            status
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          returning id::text
        `,
        [
          opportunity.subsystem,
          opportunity.opportunityType,
          opportunity.evidenceSummary,
          opportunity.sourceMetric,
          opportunity.baselineValue,
          opportunity.severity,
          opportunity.status
        ]
      );

      inserted.push(result.rows[0]?.id);
    }

    await writeTelemetryEvent(
      database,
      createTelemetryEvent({
        eventName: "opportunity_detected",
        metadata: {
          opportunityCount: inserted.length
        },
        status: inserted.length > 0 ? "success" : "skipped",
        subsystem: "improvement_engine"
      })
    ).catch(() => undefined);

    return NextResponse.json({
      detected: inserted.length,
      ok: true
    });
  } catch {
    return NextResponse.json(
      createSafeImprovementApiError({
        message: "Improvement opportunity detection failed safely.",
        status: improvementApiErrorStatus.safeFailure
      }),
      { status: 500 }
    );
  }
}
