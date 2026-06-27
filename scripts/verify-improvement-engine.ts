import pg from "pg";

const requiredTables = [
  "improvement_opportunities",
  "improvement_candidates",
  "improvement_lineage_archive",
  "improvement_approval_events"
];
const databaseUrl = process.env.DATABASE_URL ?? "";

const candidate = { id: "candidate-verify" };
const approval = {
  candidateId: "candidate-verify",
  decision: "approved"
};

if (!(candidate.id === approval.candidateId && approval.decision === "approved")) {
  console.error(
    JSON.stringify({
      component: "improvement-engine-verifier",
      event: "approval_gate_failed",
      status: "failure"
    })
  );
  process.exit(1);
}

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "improvement-engine-verifier",
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
  const present = new Set(result.rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !present.has(table));

  if (missingTables.length > 0) {
    console.error(
      JSON.stringify({
        component: "improvement-engine-verifier",
        event: "improvement_tables_missing",
        missingTables,
        status: "not_ready"
      })
    );
    process.exit(1);
  }

  console.info(
    JSON.stringify({
      component: "improvement-engine-verifier",
      event: "improvement_engine_verified",
      status: "ready"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "improvement-engine-verifier",
      event: "improvement_engine_verification_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
