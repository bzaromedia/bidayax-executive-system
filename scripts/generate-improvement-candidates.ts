import pg from "pg";

type Opportunity = {
  readonly id: string;
  readonly subsystem: string;
  readonly opportunityType: string;
  readonly evidenceSummary: string;
  readonly sourceMetric: string;
  readonly baselineValue: number;
  readonly severity: string;
  readonly status: string;
};

function riskScoreFor(opportunity: Opportunity) {
  const isTelephony =
    opportunity.subsystem === "telephony" ||
    opportunity.opportunityType === "telephony_readiness";
  const isSafety =
    opportunity.opportunityType === "safety_gate" ||
    opportunity.subsystem === "security";

  return Math.min(
    100,
    20 + (isTelephony ? 40 : 0) + (isSafety ? 20 : 0) + (opportunity.severity === "high" ? 12 : 4)
  );
}

function generateCandidate(opportunity: Opportunity) {
  const riskScore = riskScoreFor(opportunity);
  const evidenceScore = Math.min(100, Math.round(opportunity.baselineValue) + 30);
  const expectedImpact = opportunity.severity === "high" ? 28 : 18;
  const complexityScore = Math.min(30, Math.round(riskScore / 3));
  const priorityScore = Math.max(
    0,
    evidenceScore + expectedImpact + 6 - Math.round(riskScore / 4) - complexityScore
  );

  return {
    complexityScore,
    evidenceScore,
    expectedImpact,
    expectedMetric: opportunity.sourceMetric,
    hypothesis: `If BidayaX addresses ${opportunity.sourceMetric}, the measured subsystem should improve after future sandbox validation.`,
    priorityScore,
    proposedChangeSummary:
      "Create a scoped improvement proposal backed by telemetry, tests, rollback requirements, and human review.",
    riskScore,
    status: riskScore >= 45 ? "sandbox_required" : "needs_review",
    targetSubsystem: opportunity.subsystem,
    title: `Review ${opportunity.subsystem} ${opportunity.opportunityType.replaceAll("_", " ")} opportunity`
  };
}

function variantId(title: string) {
  return `phase13-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)}`;
}

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "improvement-candidate-generator",
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
  const result = await pool.query<{
    readonly id: string;
    readonly subsystem: string;
    readonly opportunity_type: string;
    readonly evidence_summary: string;
    readonly source_metric: string;
    readonly baseline_value: string | number;
    readonly severity: string;
    readonly status: string;
  }>(
    `
      select
        id::text,
        subsystem,
        opportunity_type,
        evidence_summary,
        source_metric,
        baseline_value,
        severity,
        status
      from improvement_opportunities
      where status = 'detected'
      order by created_at asc
      limit 50
    `
  );
  let generated = 0;

  for (const row of result.rows) {
    const opportunity: Opportunity = {
      baselineValue:
        typeof row.baseline_value === "number"
          ? row.baseline_value
          : Number.parseFloat(row.baseline_value),
      evidenceSummary: row.evidence_summary,
      id: row.id,
      opportunityType: row.opportunity_type,
      severity: row.severity,
      sourceMetric: row.source_metric,
      status: row.status,
      subsystem: row.subsystem
    };
    const candidate = generateCandidate(opportunity);
    const candidateResult = await pool.query<{ readonly id: string }>(
      `
        insert into improvement_candidates (
          opportunity_id,
          title,
          hypothesis,
          target_subsystem,
          proposed_change_summary,
          expected_metric,
          expected_impact,
          risk_score,
          evidence_score,
          complexity_score,
          priority_score,
          status
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        returning id::text
      `,
      [
        row.id,
        candidate.title,
        candidate.hypothesis,
        candidate.targetSubsystem,
        candidate.proposedChangeSummary,
        candidate.expectedMetric,
        candidate.expectedImpact,
        candidate.riskScore,
        candidate.evidenceScore,
        candidate.complexityScore,
        candidate.priorityScore,
        candidate.status
      ]
    );
    const candidateId = candidateResult.rows[0]?.id ?? null;

    await pool.query(
      `
        insert into improvement_lineage_archive (
        candidate_id,
        parent_candidate_id,
        variant_id,
        target_area,
        hypothesis,
          metrics_before,
          metrics_after,
          test_results,
          benchmark_results,
          review_notes,
          risk_score,
          approval_status,
          rollback_plan
        )
        values ($1, $2, $3, $4, $5, $6::jsonb, null, null, null, $7, $8, $9, $10)
      `,
      [
        candidateId,
        null,
        variantId(candidate.title),
        candidate.targetSubsystem,
        candidate.hypothesis,
        JSON.stringify({ [opportunity.sourceMetric]: opportunity.baselineValue, source: "telemetry" }),
        "Awaiting human review. Phase 13 does not implement this candidate.",
        candidate.riskScore,
        "pending",
        "Any future implementation must be sandbox-tested and reversible before production promotion."
      ]
    );
    await pool.query(
      "update improvement_opportunities set status = 'candidate_generated', updated_at = now() where id = $1",
      [row.id]
    );
    generated += 1;
  }

  console.info(
    JSON.stringify({
      candidateCount: generated,
      component: "improvement-candidate-generator",
      event: "improvement_candidates_generated",
      status: "success"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "improvement-candidate-generator",
      event: "improvement_candidate_generation_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
