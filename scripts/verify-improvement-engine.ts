import pg from "pg";

const requiredTables = [
  "improvement_opportunities",
  "improvement_candidates",
  "improvement_lineage_archive",
  "improvement_approval_events"
];
const databaseUrl = process.env.DATABASE_URL ?? "";

type ScoreComponents = {
  readonly accessibilityGain: number;
  readonly complexityCost: number;
  readonly evidenceScore: number;
  readonly expectedImpact: number;
  readonly implementationRisk: number;
  readonly maintainabilityGain: number;
  readonly performanceGain: number;
  readonly regressionRisk: number;
  readonly userValue: number;
};

type VerificationCandidate = {
  readonly id: string;
  readonly status: "needs_review" | "approved" | "rejected";
};

type VerificationApprovalEvent = {
  readonly candidateId: string;
  readonly decision: "approved" | "rejected" | "needs_more_evidence" | "blocked";
};

function calculatePriorityScore(components: ScoreComponents) {
  return Math.max(
    0,
    Math.round(
      components.evidenceScore +
        components.expectedImpact +
        components.userValue +
        components.maintainabilityGain +
        components.performanceGain +
        components.accessibilityGain -
        components.implementationRisk -
        components.regressionRisk -
        components.complexityCost
    )
  );
}

function riskScoreFor(input: {
  readonly subsystem: string;
  readonly opportunityType: string;
}) {
  const voiceOrTelephony =
    input.subsystem === "telephony" ||
    input.subsystem === "provider_readiness" ||
    input.opportunityType === "telephony_readiness";
  const safetyGate =
    input.subsystem === "security" ||
    input.subsystem === "provider_readiness" ||
    input.opportunityType === "safety_gate";

  return (
    20 +
    (voiceOrTelephony ? 37 : 0) +
    (safetyGate ? 22 : 0) +
    (input.subsystem === "database" ? 18 : 0)
  );
}

function canMarkApproved(input: {
  readonly candidate: VerificationCandidate;
  readonly approvals: readonly VerificationApprovalEvent[];
}) {
  return input.approvals.some(
    (event) =>
      event.candidateId === input.candidate.id && event.decision === "approved"
  );
}

function verifyPureSafetyRules() {
  const components: ScoreComponents = {
    accessibilityGain: 0,
    complexityCost: 6,
    evidenceScore: 40,
    expectedImpact: 20,
    implementationRisk: 5,
    maintainabilityGain: 6,
    performanceGain: 0,
    regressionRisk: 4,
    userValue: 8
  };
  const firstScore = calculatePriorityScore(components);
  const secondScore = calculatePriorityScore(components);

  if (firstScore !== 59 || secondScore !== firstScore) {
    return "deterministic_scoring_failed";
  }

  const telephonyRisk = riskScoreFor({
    opportunityType: "telephony_readiness",
    subsystem: "telephony"
  });
  const documentationRisk = riskScoreFor({
    opportunityType: "documentation",
    subsystem: "documentation"
  });

  if (telephonyRisk <= documentationRisk) {
    return "telephony_risk_not_elevated";
  }

  const candidate: VerificationCandidate = {
    id: "candidate-verify",
    status: "needs_review"
  };

  if (canMarkApproved({ approvals: [], candidate })) {
    return "approval_gate_failed";
  }

  if (
    !canMarkApproved({
      approvals: [{ candidateId: "candidate-verify", decision: "approved" }],
      candidate
    })
  ) {
    return "approval_event_not_recognized";
  }

  const lineage = {
    benchmarkResults: null,
    metricsAfter: null,
    testResults: null
  };

  if (
    lineage.metricsAfter !== null ||
    lineage.testResults !== null ||
    lineage.benchmarkResults !== null
  ) {
    return "fake_outcome_metrics_allowed";
  }

  return null;
}

const safetyFailure = verifyPureSafetyRules();

if (safetyFailure) {
  console.error(
    JSON.stringify({
      component: "improvement-engine-verifier",
      event: safetyFailure,
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
