import type {
  TelemetryErrorEvent,
  TelemetryEvent,
  TelemetryMetric,
  TelemetrySafetyGateEvent
} from "@bidayax/types";

export type TelemetryQueryExecutor = {
  readonly query: (sql: string, values: readonly unknown[]) => Promise<unknown>;
};

export async function writeTelemetryEvent(
  executor: TelemetryQueryExecutor,
  event: TelemetryEvent
) {
  await executor.query(
    `
      insert into telemetry_events (
        event_name,
        subsystem,
        severity,
        status,
        correlation_id,
        session_id,
        anonymous_visitor_id,
        executive_slug,
        duration_ms,
        metadata,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
    `,
    [
      event.eventName,
      event.subsystem,
      event.severity,
      event.status,
      event.correlationId,
      event.sessionId,
      event.anonymousVisitorId,
      event.executiveSlug,
      event.durationMs,
      JSON.stringify(event.metadata),
      event.createdAt
    ]
  );
}

export async function writeTelemetryMetric(
  executor: TelemetryQueryExecutor,
  metric: TelemetryMetric
) {
  await executor.query(
    `
      insert into telemetry_metrics (
        metric_name,
        subsystem,
        metric_value,
        metric_unit,
        dimensions,
        measured_at
      )
      values ($1, $2, $3, $4, $5::jsonb, $6)
    `,
    [
      metric.metricName,
      metric.subsystem,
      metric.metricValue,
      metric.metricUnit,
      JSON.stringify(metric.dimensions),
      metric.measuredAt
    ]
  );
}

export async function writeTelemetryError(
  executor: TelemetryQueryExecutor,
  error: TelemetryErrorEvent
) {
  await executor.query(
    `
      insert into telemetry_error_events (
        subsystem,
        error_code,
        error_category,
        severity,
        safe_message,
        correlation_id,
        metadata,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
    `,
    [
      error.subsystem,
      error.errorCode,
      error.errorCategory,
      error.severity,
      error.safeMessage,
      error.correlationId,
      JSON.stringify(error.metadata),
      error.createdAt
    ]
  );
}

export async function writeTelemetrySafetyGateEvent(
  executor: TelemetryQueryExecutor,
  event: TelemetrySafetyGateEvent
) {
  await executor.query(
    `
      insert into telemetry_safety_gate_events (
        gate_name,
        subsystem,
        decision,
        reason_codes,
        correlation_id,
        metadata,
        created_at
      )
      values ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7)
    `,
    [
      event.gateName,
      event.subsystem,
      event.decision,
      JSON.stringify(event.reasonCodes),
      event.correlationId,
      JSON.stringify(event.metadata),
      event.createdAt
    ]
  );
}

