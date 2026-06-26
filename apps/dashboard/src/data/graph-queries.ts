import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  isContactGraphEdgeType,
  isExecutiveSlug,
  isIntentTier,
  type DashboardContactGraphSummary,
  type DashboardEngagementPath,
  type DashboardRelationshipSnapshot,
  type DashboardStatus
} from "@bidayax/types";
import { executiveLabels } from "../lib/formatters";

type SummaryRow = {
  readonly node_count: string | number;
  readonly edge_count: string | number;
  readonly snapshot_count: string | number;
  readonly visitor_count: string | number;
  readonly session_count: string | number;
  readonly executive_count: string | number;
  readonly highest_intent_score: number | null;
};

type SnapshotRow = {
  readonly id: string;
  readonly executive_slug: string;
  readonly total_events: number;
  readonly highest_intent_score: number | null;
  readonly highest_intent_tier: string | null;
  readonly engagement_summary: string;
  readonly last_activity_at: Date | null;
};

type EngagementPathRow = {
  readonly id: string;
  readonly edge_type: string;
  readonly source_label: string;
  readonly target_label: string;
  readonly weight: number;
  readonly created_at: Date | null;
};

export type GraphDashboardData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly summary: DashboardContactGraphSummary;
  readonly snapshots: readonly DashboardRelationshipSnapshot[];
  readonly engagementPaths: readonly DashboardEngagementPath[];
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
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = new Pool(config);

  return pool;
}

function logGraphDashboardEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "executive-contact-graph-dashboard",
      event,
      ...details
    })
  );
}

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function emptySummary(): DashboardContactGraphSummary {
  return {
    edgeCount: 0,
    executiveCount: 0,
    highestIntentScore: null,
    nodeCount: 0,
    sessionCount: 0,
    snapshotCount: 0,
    visitorCount: 0
  };
}

function emptyGraphData(
  status: DashboardStatus,
  statusMessage: string
): GraphDashboardData {
  return {
    engagementPaths: [],
    snapshots: [],
    status,
    statusMessage,
    summary: emptySummary()
  };
}

function normalizeSummary(row: SummaryRow | undefined): DashboardContactGraphSummary {
  if (!row) {
    return emptySummary();
  }

  return {
    edgeCount: parseCount(row.edge_count),
    executiveCount: parseCount(row.executive_count),
    highestIntentScore: row.highest_intent_score,
    nodeCount: parseCount(row.node_count),
    sessionCount: parseCount(row.session_count),
    snapshotCount: parseCount(row.snapshot_count),
    visitorCount: parseCount(row.visitor_count)
  };
}

function normalizeSnapshots(
  rows: readonly SnapshotRow[]
): readonly DashboardRelationshipSnapshot[] {
  return rows.flatMap((row, index) => {
    if (!isExecutiveSlug(row.executive_slug)) {
      logGraphDashboardEvent("warn", "invalid_graph_data", {
        field: "executive_slug"
      });
      return [];
    }

    if (row.highest_intent_tier && !isIntentTier(row.highest_intent_tier)) {
      logGraphDashboardEvent("warn", "invalid_graph_data", {
        field: "highest_intent_tier"
      });
      return [];
    }

    const highestIntentTier: DashboardRelationshipSnapshot["highestIntentTier"] =
      row.highest_intent_tier && isIntentTier(row.highest_intent_tier)
        ? row.highest_intent_tier
        : null;

    return [
      {
        engagementSummary: row.engagement_summary,
        executiveName: executiveLabels[row.executive_slug],
        executiveSlug: row.executive_slug,
        highestIntentScore: row.highest_intent_score,
        highestIntentTier,
        id: row.id,
        label: `Relationship Snapshot #${index + 1}`,
        lastActivityAt: row.last_activity_at?.toISOString() ?? null,
        totalEvents: row.total_events
      }
    ];
  });
}

function normalizeEngagementPaths(
  rows: readonly EngagementPathRow[]
): readonly DashboardEngagementPath[] {
  return rows.flatMap((row) => {
    if (!isContactGraphEdgeType(row.edge_type)) {
      logGraphDashboardEvent("warn", "invalid_graph_data", {
        field: "edge_type"
      });
      return [];
    }

    return [
      {
        createdAt: row.created_at?.toISOString() ?? null,
        edgeType: row.edge_type,
        id: row.id,
        sourceLabel: row.source_label,
        targetLabel: row.target_label,
        weight: row.weight
      }
    ];
  });
}

export async function getGraphDashboardData(): Promise<GraphDashboardData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyGraphData(
      "not_configured",
      "DATABASE_URL is not configured. Contact graph snapshots will appear after PostgreSQL is connected and the graph rebuild runs."
    );
  }

  try {
    const [summaryResult, snapshotResult, pathResult] = await Promise.all([
      database.query<SummaryRow>(
        `
          select
            (select count(*)::bigint from contact_graph_nodes) as node_count,
            (select count(*)::bigint from contact_graph_edges) as edge_count,
            (select count(*)::bigint from contact_graph_snapshots) as snapshot_count,
            (select count(*)::bigint from contact_graph_nodes where node_type = 'visitor') as visitor_count,
            (select count(*)::bigint from contact_graph_nodes where node_type = 'session') as session_count,
            (select count(*)::bigint from contact_graph_nodes where node_type = 'executive') as executive_count,
            (select max(highest_intent_score)::int from contact_graph_snapshots) as highest_intent_score
        `
      ),
      database.query<SnapshotRow>(
        `
          select
            id::text,
            executive_slug,
            total_events,
            highest_intent_score,
            highest_intent_tier,
            engagement_summary,
            last_activity_at
          from contact_graph_snapshots
          order by highest_intent_score desc nulls last, last_activity_at desc nulls last
          limit 8
        `
      ),
      database.query<EngagementPathRow>(
        `
          select
            edge.id::text,
            edge.edge_type::text,
            source.label as source_label,
            target.label as target_label,
            edge.weight,
            edge.created_at
          from contact_graph_edges edge
          join contact_graph_nodes source on source.id = edge.source_node_id
          join contact_graph_nodes target on target.id = edge.target_node_id
          order by edge.updated_at desc
          limit 12
        `
      )
    ]);
    const data = {
      engagementPaths: normalizeEngagementPaths(pathResult.rows),
      snapshots: normalizeSnapshots(snapshotResult.rows),
      status: "ready",
      statusMessage: "Showing contact_graph relationship structure.",
      summary: normalizeSummary(summaryResult.rows[0])
    } satisfies GraphDashboardData;

    logGraphDashboardEvent("info", "graph_query_success", {
      edgeCount: data.summary.edgeCount,
      nodeCount: data.summary.nodeCount,
      snapshotCount: data.summary.snapshotCount
    });

    if (data.summary.nodeCount === 0) {
      logGraphDashboardEvent("info", "empty_data_state", {
        reason: "no_contact_graph_nodes"
      });
    }

    return data;
  } catch {
    logGraphDashboardEvent("error", "graph_query_failure");

    return emptyGraphData(
      "query_failed",
      "Contact graph queries failed. Run the Phase 7 migration and graph rebuild path."
    );
  }
}
