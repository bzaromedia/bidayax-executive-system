import pg from "pg";

function generateSmokeCandidate() {
  return {
    complexityScore: 12,
    evidenceScore: 80,
    expectedImpact: 28,
    expectedMetric: "api_latency_ms",
    hypothesis:
      "If BidayaX reviews the measured latency path in a future sandbox, API latency should improve without production auto-change.",
    priorityScore: 75,
    proposedChangeSummary:
      "Review request timing and propose a sandbox-only performance improvement.",
    riskScore: 40,
    status: "needs_review",
    targetSubsystem: "system",
    title: "Review system performance opportunity"
  };
}

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "improvement-engine-smoke-test",
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
  const opportunity = {
    baselineValue: 1200,
    evidenceSummary:
      "Smoke test evidence: local API latency sample exceeded the Phase 13 threshold.",
    opportunityType: "performance",
    severity: "high",
    sourceMetric: "api_latency_ms",
    status: "detected",
    subsystem: "system"
  };
  const opportunityResult = await pool.query<{ readonly id: string }>(
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
  const opportunityId = opportunityResult.rows[0]?.id;
  const candidate = generateSmokeCandidate();
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
      opportunityId,
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
  const candidateId = candidateResult.rows[0]?.id;

  await pool.query(
    `
      insert into improvement_lineage_archive (
        candidate_id,
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
      values ($1, $2, $3, $4, $5::jsonb, null, null, null, $6, $7, $8, $9)
    `,
      [
        candidateId,
      "phase13-review-system-performance-opportunity",
      candidate.targetSubsystem,
      candidate.hypothesis,
      JSON.stringify({ api_latency_ms: opportunity.baselineValue, source: "telemetry" }),
      "Awaiting human review. Phase 13 does not implement this candidate.",
      candidate.riskScore,
      "pending",
      "Any future implementation must be sandbox-tested and reversible before production promotion."
    ]
  );

  console.info(
    JSON.stringify({
      candidateId,
      component: "improvement-engine-smoke-test",
      event: "improvement_engine_smoke_test_completed",
      opportunityId,
      status: "success"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "improvement-engine-smoke-test",
      event: "improvement_engine_smoke_test_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
