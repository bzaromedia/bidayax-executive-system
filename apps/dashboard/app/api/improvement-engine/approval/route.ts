import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  createSafeImprovementApiError,
  improvementApiErrorStatus
} from "@bidayax/improvement-engine";
import { isImprovementApprovalDecision } from "@bidayax/types";
import {
  createTelemetryEvent,
  writeTelemetryEvent
} from "@bidayax/telemetry";

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

export async function POST(request: Request) {
  const database = getDatabasePool();

  if (!database) {
    return NextResponse.json(
      createSafeImprovementApiError({
        message: "DATABASE_URL is not configured.",
        status: improvementApiErrorStatus.notConfigured
      }),
      { status: 503 }
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const candidateId = typeof payload.candidateId === "string" ? payload.candidateId : "";
    const decision = typeof payload.decision === "string" ? payload.decision : "";
    const decidedBy =
      typeof payload.decidedBy === "string" ? payload.decidedBy : "human-reviewer";
    const decisionNotes =
      typeof payload.decisionNotes === "string"
        ? payload.decisionNotes
        : "Human review event recorded.";

    if (!candidateId || !isImprovementApprovalDecision(decision)) {
      return NextResponse.json(
        createSafeImprovementApiError({
          message: "Invalid approval payload.",
          status: improvementApiErrorStatus.invalidRequest
        }),
        { status: 400 }
      );
    }

    await database.query(
      `
        insert into improvement_approval_events (
          candidate_id,
          decision,
          decided_by,
          decision_notes
        )
        values ($1, $2, $3, $4)
      `,
      [candidateId, decision, decidedBy, decisionNotes]
    );
    await database.query(
      `
        update improvement_candidates
        set status = case
          when $2 = 'approved' then 'approved'
          when $2 = 'rejected' then 'rejected'
          when $2 = 'blocked' then 'archived'
          else 'needs_review'
        end,
        updated_at = now()
        where id = $1
      `,
      [candidateId, decision]
    );
    await database.query(
      `
        update improvement_lineage_archive
        set approval_status = $2,
            updated_at = now()
        where candidate_id = $1
      `,
      [candidateId, decision]
    );
    await writeTelemetryEvent(
      database,
      createTelemetryEvent({
        eventName:
          decision === "approved"
            ? "candidate_approved"
            : decision === "rejected"
              ? "candidate_rejected"
              : "approval_requested",
        metadata: {
          candidateId,
          decision
        },
        status: "success",
        subsystem: "improvement_engine"
      })
    ).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      status:
        decision === "approved"
          ? "approved_for_future_sandbox_only"
          : "decision_archived"
    });
  } catch {
    return NextResponse.json(
      createSafeImprovementApiError({
        message: "Improvement approval event failed safely.",
        status: improvementApiErrorStatus.safeFailure
      }),
      { status: 500 }
    );
  }
}
