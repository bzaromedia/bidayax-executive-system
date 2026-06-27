import { Pool } from "pg";
import type { PoolConfig } from "pg";
import type { DashboardImprovementEngineData, DashboardStatus } from "@bidayax/types";

type SummaryRow = {
  readonly opportunity_count: string | number;
  readonly candidate_count: string | number;
  readonly pending_approval_count: string | number;
  readonly approved_count: string | number;
  readonly rejected_count: string | number;
  readonly archived_lineage_count: string | number;
  readonly average_evidence_score: string | number | null;
  readonly average_risk_score: string | number | null;
};

type OpportunityRow = {
  readonly id: string;
  readonly subsystem: string;
  readonly opportunity_type: string;
  readonly evidence_summary: string;
  readonly source_metric: string;
  readonly baseline_value: string | number;
  readonly severity: string;
  readonly status: string;
  readonly created_at: Date;
};

type CandidateRow = {
  readonly id: string;
  readonly opportunity_id: string | null;
  readonly title: string;
  readonly hypothesis: string;
  readonly target_subsystem: string;
  readonly proposed_change_summary: string;
  readonly expected_metric: string;
  readonly expected_impact: string | number;
  readonly risk_score: string | number;
  readonly evidence_score: string | number;
  readonly complexity_score: string | number;
  readonly priority_score: string | number;
  readonly status: string;
  readonly created_at: Date;
};

type LineageRow = {
  readonly id: string;
  readonly candidate_id: string | null;
  readonly variant_id: string;
  readonly target_area: string;
  readonly hypothesis: string;
  readonly risk_score: string | number;
  readonly approval_status: string;
  readonly rollback_plan: string;
  readonly metrics_after_is_empty: boolean;
  readonly created_at: Date;
};

type ApprovalRow = {
  readonly id: string;
  readonly candidate_id: string;
  readonly decision: string;
  readonly decided_by: string;
  readonly decision_notes: string;
  readonly created_at: Date;
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
    config.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(config);

  return pool;
}

function numberFrom(value: string | number | null) {
  if (value === null) {
    return 0;
  }

  return typeof value === "number" ? value : Number.parseFloat(value);
}

function emptyImprovementData(
  status: DashboardStatus,
  statusMessage: string
): DashboardImprovementEngineData {
  return {
    approvals: [],
    candidates: [],
    lineage: [],
    opportunities: [],
    status,
    statusMessage,
    summary: {
      approvedCount: 0,
      archivedLineageCount: 0,
      averageEvidenceScore: 0,
      averageRiskScore: 0,
      candidateCount: 0,
      opportunityCount: 0,
      pendingApprovalCount: 0,
      rejectedCount: 0
    }
  };
}

export async function getImprovementEngineDashboardData(): Promise<DashboardImprovementEngineData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyImprovementData(
      "not_configured",
      "DATABASE_URL is not configured. Improvement proposals will appear after telemetry-backed tables are available."
    );
  }

  try {
    const [summaryResult, opportunitiesResult, candidatesResult, lineageResult, approvalsResult] =
      await Promise.all([
        database.query<SummaryRow>(
          `
            select
              (select count(*)::bigint from improvement_opportunities) as opportunity_count,
              (select count(*)::bigint from improvement_candidates) as candidate_count,
              (
                select count(*)::bigint
                from improvement_candidates
                where status in ('proposed', 'needs_review', 'sandbox_required')
              ) as pending_approval_count,
              (
                select count(*)::bigint
                from improvement_candidates
                where status = 'approved'
              ) as approved_count,
              (
                select count(*)::bigint
                from improvement_candidates
                where status = 'rejected'
              ) as rejected_count,
              (select count(*)::bigint from improvement_lineage_archive) as archived_lineage_count,
              (select coalesce(avg(evidence_score), 0) from improvement_candidates) as average_evidence_score,
              (select coalesce(avg(risk_score), 0) from improvement_candidates) as average_risk_score
          `
        ),
        database.query<OpportunityRow>(
          `
            select
              id::text,
              subsystem,
              opportunity_type,
              evidence_summary,
              source_metric,
              baseline_value,
              severity,
              status,
              created_at
            from improvement_opportunities
            order by created_at desc
            limit 20
          `
        ),
        database.query<CandidateRow>(
          `
            select
              id::text,
              opportunity_id::text,
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
              status,
              created_at
            from improvement_candidates
            order by priority_score desc, created_at desc
            limit 20
          `
        ),
        database.query<LineageRow>(
          `
            select
              id::text,
              candidate_id::text,
              variant_id,
              target_area,
              hypothesis,
              risk_score,
              approval_status,
              rollback_plan,
              metrics_after is null as metrics_after_is_empty,
              created_at
            from improvement_lineage_archive
            order by created_at desc
            limit 20
          `
        ),
        database.query<ApprovalRow>(
          `
            select
              id::text,
              candidate_id::text,
              decision,
              decided_by,
              decision_notes,
              created_at
            from improvement_approval_events
            order by created_at desc
            limit 20
          `
        )
      ]);
    const summaryRow = summaryResult.rows[0];

    return {
      approvals: approvalsResult.rows.map((row) => ({
        candidateId: row.candidate_id,
        createdAt: row.created_at.toISOString(),
        decidedBy: row.decided_by,
        decision: row.decision,
        decisionNotes: row.decision_notes,
        id: row.id
      })),
      candidates: candidatesResult.rows.map((row) => ({
        complexityScore: numberFrom(row.complexity_score),
        createdAt: row.created_at.toISOString(),
        evidenceScore: numberFrom(row.evidence_score),
        expectedImpact: numberFrom(row.expected_impact),
        expectedMetric: row.expected_metric,
        hypothesis: row.hypothesis,
        id: row.id,
        opportunityId: row.opportunity_id,
        priorityScore: numberFrom(row.priority_score),
        proposedChangeSummary: row.proposed_change_summary,
        riskScore: numberFrom(row.risk_score),
        status: row.status as never,
        targetSubsystem: row.target_subsystem as never,
        title: row.title
      })),
      lineage: lineageResult.rows.map((row) => ({
        approvalStatus: row.approval_status as never,
        candidateId: row.candidate_id,
        createdAt: row.created_at.toISOString(),
        hypothesis: row.hypothesis,
        id: row.id,
        metricsAfterIsEmpty: row.metrics_after_is_empty,
        riskScore: numberFrom(row.risk_score),
        rollbackPlan: row.rollback_plan,
        targetArea: row.target_area as never,
        variantId: row.variant_id
      })),
      opportunities: opportunitiesResult.rows.map((row) => ({
        baselineValue: numberFrom(row.baseline_value),
        createdAt: row.created_at.toISOString(),
        evidenceSummary: row.evidence_summary,
        id: row.id,
        opportunityType: row.opportunity_type as never,
        severity: row.severity as never,
        sourceMetric: row.source_metric,
        status: row.status as never,
        subsystem: row.subsystem as never
      })),
      status: "ready",
      statusMessage:
        "Showing evidence-backed improvement proposals. No candidate shown here has been implemented or deployed by Phase 13.",
      summary: {
        approvedCount: summaryRow ? numberFrom(summaryRow.approved_count) : 0,
        archivedLineageCount: summaryRow
          ? numberFrom(summaryRow.archived_lineage_count)
          : 0,
        averageEvidenceScore: summaryRow
          ? numberFrom(summaryRow.average_evidence_score)
          : 0,
        averageRiskScore: summaryRow ? numberFrom(summaryRow.average_risk_score) : 0,
        candidateCount: summaryRow ? numberFrom(summaryRow.candidate_count) : 0,
        opportunityCount: summaryRow
          ? numberFrom(summaryRow.opportunity_count)
          : 0,
        pendingApprovalCount: summaryRow
          ? numberFrom(summaryRow.pending_approval_count)
          : 0,
        rejectedCount: summaryRow ? numberFrom(summaryRow.rejected_count) : 0
      }
    };
  } catch {
    return emptyImprovementData(
      "query_failed",
      "Improvement engine queries failed. Run the Phase 13 migration before viewing proposals."
    );
  }
}
