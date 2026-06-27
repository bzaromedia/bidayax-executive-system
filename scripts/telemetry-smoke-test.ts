import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "telemetry-smoke-test",
      event: "database_url_missing",
      status: "not_ready"
    })
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 1,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

try {
  const correlationId = `telemetry-smoke-${Date.now()}`;

  await pool.query(
    `
      insert into telemetry_events (
        event_name,
        subsystem,
        severity,
        status,
        correlation_id,
        duration_ms,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      "telemetry_smoke_test_completed",
      "system",
      "info",
      "success",
      correlationId,
      1,
      JSON.stringify({ source: "script", secret: "[redacted]" })
    ]
  );
  await pool.query(
    `
      insert into telemetry_metrics (
        metric_name,
        subsystem,
        metric_value,
        metric_unit,
        dimensions,
        measured_at
      )
      values ($1, $2, $3, $4, $5::jsonb, now())
    `,
    [
      "telemetry_smoke_metric",
      "system",
      1,
      "count",
      JSON.stringify({ source: "script" })
    ]
  );
  await pool.query(
    `
      insert into telemetry_error_events (
        subsystem,
        error_code,
        error_category,
        severity,
        safe_message,
        correlation_id,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      "system",
      "TELEMETRY_SMOKE_SAFE_ERROR",
      "verification",
      "warning",
      "Smoke test safe error record.",
      correlationId,
      JSON.stringify({ secret: "[redacted]" })
    ]
  );
  await pool.query(
    `
      insert into telemetry_safety_gate_events (
        gate_name,
        subsystem,
        decision,
        reason_codes,
        correlation_id,
        metadata
      )
      values ($1, $2, $3, $4::jsonb, $5, $6::jsonb)
    `,
    [
      "telemetry_smoke_gate",
      "system",
      "skipped",
      JSON.stringify(["SMOKE_TEST_ONLY"]),
      correlationId,
      JSON.stringify({ source: "script" })
    ]
  );

  console.info(
    JSON.stringify({
      component: "telemetry-smoke-test",
      correlationId,
      event: "telemetry_smoke_test_completed",
      status: "success"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "telemetry-smoke-test",
      event: "telemetry_smoke_test_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

