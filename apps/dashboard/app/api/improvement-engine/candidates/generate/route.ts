import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  createLineageEntry,
  generateImprovementCandidate
} from "@bidayax/improvement-engine";
import {
  createTelemetryEvent,
  writeTelemetryEvent
} from "@bidayax/telemetry";
import type { ImprovementOpportunity } from "@bidayax/types";

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

type OpportunityRow = {
  readonly id: string;
  readonly subsystem: ImprovementOpportunity["subsystem"];
  readonly opportunity_type: ImprovementOpportunity["opportunityType"];
  readonly evidence_summary: string;
  readonly source_metric: string;
  readonly baseline_value: string | number;
  readonly severity: ImprovementOpportunity["severity"];
  readonly status: ImprovementOpportunity["status"];
};

export async function POST() {
  const database = getDatabasePool();

  if (!database) {
    return NextResponse.json(
      {
        error: "DATABASE_URL is not configured.",
        status: "not_configured"
      },
      { status: 503 }
    );
  }

  try {
    const opportunitiesResult = await database.query<OpportunityRow>(
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
        limit 20
      `
    );
    let generated = 0;

    for (const row of opportunitiesResult.rows) {
      const opportunity: ImprovementOpportunity = {
        baselineValue:
          typeof row.baseline_value === "number"
            ? row.baseline_value
            : Number.parseFloat(row.baseline_value),
        evidenceSummary: row.evidence_summary,
        id: row.id,
        opportunityType: row.opportunity_type,
        reasonCodes: ["TELEMETRY_EVIDENCE_REQUIRED"],
        severity: row.severity,
        sourceMetric: row.source_metric,
        status: row.status,
        subsystem: row.subsystem
      };
      const candidate = generateImprovementCandidate(opportunity);
      const candidateResult = await database.query<{ readonly id: string }>(
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
      const lineage = createLineageEntry({
        candidate: candidateId ? { ...candidate, id: candidateId } : candidate,
        opportunity
      });

      await database.query(
        `
          insert into improvement_lineage_archive (
            candidate_id,
            parent_candidate_id,
            variant_id,
            target_area,
            hypothesis,
            design_diff_summary,
            code_diff_summary,
            metrics_before,
            metrics_after,
            test_results,
            benchmark_results,
            review_notes,
            risk_score,
            approval_status,
            rollback_plan
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, null, null, null, $9, $10, $11, $12)
        `,
        [
          candidateId,
          lineage.parentCandidateId,
          lineage.variantId,
          lineage.targetArea,
          lineage.hypothesis,
          lineage.designDiffSummary,
          lineage.codeDiffSummary,
          JSON.stringify(lineage.metricsBefore),
          lineage.reviewNotes,
          lineage.riskScore,
          lineage.approvalStatus,
          lineage.rollbackPlan
        ]
      );
      await database.query(
        `
          update improvement_opportunities
          set status = 'candidate_generated',
              updated_at = now()
          where id = $1
        `,
        [row.id]
      );
      generated += 1;
    }

    await writeTelemetryEvent(
      database,
      createTelemetryEvent({
        eventName: "candidate_generated",
        metadata: {
          candidateCount: generated
        },
        status: generated > 0 ? "success" : "skipped",
        subsystem: "improvement_engine"
      })
    ).catch(() => undefined);

    return NextResponse.json({
      generated,
      ok: true
    });
  } catch {
    return NextResponse.json(
      {
        error: "Improvement candidate generation failed safely."
      },
      { status: 500 }
    );
  }
}
