import pg from "pg";

const requiredTables = [
  "telemetry_events",
  "telemetry_metrics",
  "telemetry_error_events",
  "telemetry_safety_gate_events"
];
const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "telemetry-verifier",
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
  const result = await pool.query<{ readonly table_name: string }>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [requiredTables]
  );
  const presentTables = new Set(result.rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !presentTables.has(table));

  if (missingTables.length > 0) {
    console.error(
      JSON.stringify({
        component: "telemetry-verifier",
        event: "telemetry_tables_missing",
        missingTables,
        status: "not_ready"
      })
    );
    process.exit(1);
  }

  console.info(
    JSON.stringify({
      component: "telemetry-verifier",
      event: "telemetry_tables_verified",
      status: "ready",
      tableCount: requiredTables.length
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "telemetry-verifier",
      event: "telemetry_verification_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

