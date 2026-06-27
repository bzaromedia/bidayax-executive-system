import pg from "pg";

const retentionPolicies = [
  { days: 90, table: "telemetry_events" },
  { days: 180, table: "telemetry_metrics" },
  { days: 180, table: "telemetry_error_events" },
  { days: 365, table: "telemetry_safety_gate_events" }
];
const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "telemetry-retention-check",
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
  const results = [];

  for (const policy of retentionPolicies) {
    const result = await pool.query<{ readonly count: string }>(
      `
        select count(*)::bigint as count
        from ${policy.table}
        where created_at < now() - ($1::text)::interval
      `,
      [`${policy.days} days`]
    );

    results.push({
      olderThanPolicyCount: Number.parseInt(result.rows[0]?.count ?? "0", 10),
      retentionDays: policy.days,
      table: policy.table
    });
  }

  console.info(
    JSON.stringify({
      component: "telemetry-retention-check",
      event: "telemetry_retention_reported",
      results,
      status: "reported"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "telemetry-retention-check",
      event: "telemetry_retention_check_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

