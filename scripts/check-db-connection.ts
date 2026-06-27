import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "db-connection-check",
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
  const result = await pool.query("select 1 as ok");

  console.info(
    JSON.stringify({
      component: "db-connection-check",
      event: "database_connection_passed",
      ok: result.rows[0]?.ok === 1,
      status: "healthy"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "db-connection-check",
      event: "database_connection_failed",
      status: "not_ready"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
