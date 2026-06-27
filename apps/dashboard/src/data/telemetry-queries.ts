import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  isTelemetrySeverity,
  isTelemetryStatus,
  isTelemetrySubsystem,
  type DashboardObservabilityData,
  type DashboardStatus,
  type TelemetrySafetyGateDecision
} from "@bidayax/types";

type SummaryRow = {
  readonly event_count: string | number;
  readonly metric_count: string | number;
  readonly error_count: string | number;
  readonly safety_gate_event_count: string | number;
  readonly blocked_safety_gate_count: string | number;
  readonly subsystem_count: string | number;
};

type EventRow = {
  readonly id: string;
  readonly event_name: string;
  readonly subsystem: string;
  readonly severity: string;
  readonly status: string;
  readonly duration_ms: number | null;
  readonly correlation_id: string | null;
  readonly created_at: Date;
};

type MetricRow = {
  readonly metric_name: string;
  readonly subsystem: string;
  readonly value: string | number;
  readonly metric_unit: string;
};

type ErrorRow = {
  readonly id: string;
  readonly subsystem: string;
  readonly error_code: string;
  readonly error_category: string;
  readonly severity: string;
  readonly safe_message: string;
  readonly created_at: Date;
};

type SafetyGateRow = {
  readonly id: string;
  readonly gate_name: string;
  readonly subsystem: string;
  readonly decision: string;
  readonly reason_codes: unknown;
  readonly created_at: Date;
};

type SubsystemRow = {
  readonly subsystem: string;
  readonly event_count: string | number;
  readonly error_count: string | number;
  readonly blocked_safety_gate_count: string | number;
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

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function parseNumber(value: string | number) {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function emptyObservabilityData(
  status: DashboardStatus,
  statusMessage: string
): DashboardObservabilityData {
  return {
    errors: [],
    events: [],
    metrics: [],
    safetyGateEvents: [],
    status,
    statusMessage,
    subsystemHealth: [],
    summary: {
      blockedSafetyGateCount: 0,
      errorCount: 0,
      eventCount: 0,
      metricCount: 0,
      safetyGateEventCount: 0,
      subsystemCount: 0
    }
  };
}

function normalizeDecision(value: string): TelemetrySafetyGateDecision | null {
  if (
    value === "allowed" ||
    value === "blocked" ||
    value === "warning" ||
    value === "skipped"
  ) {
    return value;
  }

  return null;
}

function normalizeReasonCodes(value: unknown): readonly string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function normalizeSubsystemHealth(rows: readonly SubsystemRow[]) {
  return rows.flatMap((row) => {
    if (!isTelemetrySubsystem(row.subsystem)) {
      return [];
    }

    const errorCount = parseCount(row.error_count);
    const blockedSafetyGateCount = parseCount(row.blocked_safety_gate_count);

    return [
      {
        blockedSafetyGateCount,
        errorCount,
        eventCount: parseCount(row.event_count),
        status:
          errorCount > 0
            ? "attention"
            : blockedSafetyGateCount > 0
              ? "degraded"
              : "healthy",
        subsystem: row.subsystem
      } as const
    ];
  });
}

export async function getObservabilityDashboardData(): Promise<DashboardObservabilityData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyObservabilityData(
      "not_configured",
      "DATABASE_URL is not configured. Observability will show an honest empty state until telemetry tables are available."
    );
  }

  try {
    const [
      summaryResult,
      eventsResult,
      metricsResult,
      errorsResult,
      safetyGateResult,
      subsystemResult
    ] = await Promise.all([
      database.query<SummaryRow>(
        `
          select
            (select count(*)::bigint from telemetry_events) as event_count,
            (select count(*)::bigint from telemetry_metrics) as metric_count,
            (select count(*)::bigint from telemetry_error_events) as error_count,
            (select count(*)::bigint from telemetry_safety_gate_events) as safety_gate_event_count,
            (
              select count(*)::bigint
              from telemetry_safety_gate_events
              where decision = 'blocked'
            ) as blocked_safety_gate_count,
            (
              select count(distinct subsystem)::bigint
              from telemetry_events
            ) as subsystem_count
        `
      ),
      database.query<EventRow>(
        `
          select
            id::text,
            event_name,
            subsystem,
            severity,
            status,
            duration_ms,
            correlation_id,
            created_at
          from telemetry_events
          order by created_at desc
          limit 20
        `
      ),
      database.query<MetricRow>(
        `
          select
            metric_name,
            subsystem,
            avg(metric_value)::float as value,
            metric_unit
          from telemetry_metrics
          group by metric_name, subsystem, metric_unit
          order by metric_name
          limit 12
        `
      ),
      database.query<ErrorRow>(
        `
          select
            id::text,
            subsystem,
            error_code,
            error_category,
            severity,
            safe_message,
            created_at
          from telemetry_error_events
          order by created_at desc
          limit 12
        `
      ),
      database.query<SafetyGateRow>(
        `
          select
            id::text,
            gate_name,
            subsystem,
            decision,
            reason_codes,
            created_at
          from telemetry_safety_gate_events
          order by created_at desc
          limit 12
        `
      ),
      database.query<SubsystemRow>(
        `
          select
            subsystem,
            count(*)::bigint as event_count,
            (
              select count(*)::bigint
              from telemetry_error_events error_event
              where error_event.subsystem = telemetry_events.subsystem
            ) as error_count,
            (
              select count(*)::bigint
              from telemetry_safety_gate_events gate_event
              where gate_event.subsystem = telemetry_events.subsystem
                and gate_event.decision = 'blocked'
            ) as blocked_safety_gate_count
          from telemetry_events
          group by subsystem
          order by subsystem
        `
      )
    ]);
    const summaryRow = summaryResult.rows[0];

    return {
      errors: errorsResult.rows.flatMap((row) => {
        if (!isTelemetrySubsystem(row.subsystem) || !isTelemetrySeverity(row.severity)) {
          return [];
        }

        return [
          {
            createdAt: row.created_at.toISOString(),
            errorCategory: row.error_category,
            errorCode: row.error_code,
            id: row.id,
            safeMessage: row.safe_message,
            severity: row.severity,
            subsystem: row.subsystem
          }
        ];
      }),
      events: eventsResult.rows.flatMap((row) => {
        if (
          !isTelemetrySubsystem(row.subsystem) ||
          !isTelemetrySeverity(row.severity) ||
          !isTelemetryStatus(row.status)
        ) {
          return [];
        }

        return [
          {
            correlationId: row.correlation_id,
            createdAt: row.created_at.toISOString(),
            durationMs: row.duration_ms,
            eventName: row.event_name,
            id: row.id,
            severity: row.severity,
            status: row.status,
            subsystem: row.subsystem
          }
        ];
      }),
      metrics: metricsResult.rows.flatMap((row) => {
        if (!isTelemetrySubsystem(row.subsystem)) {
          return [];
        }

        return [
          {
            metricName: row.metric_name,
            subsystem: row.subsystem,
            unit: row.metric_unit,
            value: parseNumber(row.value)
          }
        ];
      }),
      safetyGateEvents: safetyGateResult.rows.flatMap((row) => {
        const decision = normalizeDecision(row.decision);

        if (!decision || !isTelemetrySubsystem(row.subsystem)) {
          return [];
        }

        return [
          {
            createdAt: row.created_at.toISOString(),
            decision,
            gateName: row.gate_name,
            id: row.id,
            reasonCodes: normalizeReasonCodes(row.reason_codes),
            subsystem: row.subsystem
          }
        ];
      }),
      status: "ready",
      statusMessage: "Showing database-backed telemetry. Empty sections mean no matching telemetry has been recorded yet.",
      subsystemHealth: normalizeSubsystemHealth(subsystemResult.rows),
      summary: {
        blockedSafetyGateCount: summaryRow
          ? parseCount(summaryRow.blocked_safety_gate_count)
          : 0,
        errorCount: summaryRow ? parseCount(summaryRow.error_count) : 0,
        eventCount: summaryRow ? parseCount(summaryRow.event_count) : 0,
        metricCount: summaryRow ? parseCount(summaryRow.metric_count) : 0,
        safetyGateEventCount: summaryRow
          ? parseCount(summaryRow.safety_gate_event_count)
          : 0,
        subsystemCount: summaryRow ? parseCount(summaryRow.subsystem_count) : 0
      }
    };
  } catch {
    return emptyObservabilityData(
      "query_failed",
      "Telemetry queries failed. Run the Phase 12 migration before viewing observability data."
    );
  }
}
