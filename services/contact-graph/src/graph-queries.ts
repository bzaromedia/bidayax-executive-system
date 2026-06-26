import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  isExecutiveSlug,
  isInteractionEventType,
  isIntentTier,
  type ContactGraphBuildResult,
  type ContactGraphInteractionEvent,
  type ContactGraphIntentScore,
  type ContactGraphNode
} from "@bidayax/types";
import { buildGraphFromEvents } from "./build-graph-from-events";

type InteractionEventRow = {
  readonly id: string;
  readonly event_type: string;
  readonly executive_slug: string;
  readonly anonymous_visitor_id: string;
  readonly session_id: string;
  readonly source_url: string | null;
  readonly referrer: string | null;
  readonly device_type: string | null;
  readonly browser: string | null;
  readonly os: string | null;
  readonly created_at: Date;
};

type IntentScoreRow = {
  readonly id: string;
  readonly anonymous_visitor_id: string;
  readonly session_id: string;
  readonly executive_slug: string;
  readonly score: number;
  readonly tier: string;
  readonly reason_codes: string[];
  readonly scoring_version: string;
  readonly event_count: number;
  readonly first_event_at: Date | null;
  readonly last_event_at: Date | null;
};

type GraphNodeIdRow = {
  readonly id: string;
};

export type RebuildContactGraphOptions = {
  readonly databaseUrl?: string;
  readonly databaseSsl?: boolean;
  readonly poolMax?: number;
};

export type RebuildContactGraphResult = ContactGraphBuildResult & {
  readonly graphBuildStartedAt: string;
  readonly graphBuildCompletedAt: string;
};

function getPool(options: RebuildContactGraphOptions) {
  const connectionString = options.databaseUrl ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to rebuild the contact graph.");
  }

  const config: PoolConfig = {
    connectionString,
    max:
      options.poolMax ??
      Number.parseInt(process.env.PG_POOL_MAX ?? "5", 10)
  };

  if (options.databaseSsl ?? process.env.DATABASE_SSL === "true") {
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  return new Pool(config);
}

function logGraphEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "executive-contact-graph",
      event,
      ...details
    })
  );
}

function toGraphEvent(row: InteractionEventRow): ContactGraphInteractionEvent | null {
  if (!isInteractionEventType(row.event_type)) {
    logGraphEvent("warn", "invalid_event_data_encountered", {
      field: "event_type"
    });
    return null;
  }

  if (!isExecutiveSlug(row.executive_slug)) {
    logGraphEvent("warn", "invalid_event_data_encountered", {
      field: "executive_slug"
    });
    return null;
  }

  return {
    anonymousVisitorId: row.anonymous_visitor_id,
    browser: row.browser,
    createdAt: row.created_at.toISOString(),
    deviceType: row.device_type,
    eventType: row.event_type,
    executiveSlug: row.executive_slug,
    id: row.id,
    os: row.os,
    referrer: row.referrer,
    sessionId: row.session_id,
    sourceUrl: row.source_url
  };
}

function toGraphIntentScore(row: IntentScoreRow): ContactGraphIntentScore | null {
  if (!isExecutiveSlug(row.executive_slug)) {
    logGraphEvent("warn", "invalid_intent_data_encountered", {
      field: "executive_slug"
    });
    return null;
  }

  if (!isIntentTier(row.tier)) {
    logGraphEvent("warn", "invalid_intent_data_encountered", {
      field: "tier"
    });
    return null;
  }

  return {
    anonymousVisitorId: row.anonymous_visitor_id,
    eventCount: row.event_count,
    executiveSlug: row.executive_slug,
    firstEventAt: row.first_event_at?.toISOString() ?? null,
    id: row.id,
    lastEventAt: row.last_event_at?.toISOString() ?? null,
    reasonCodes: row.reason_codes,
    score: row.score,
    scoringVersion: row.scoring_version as ContactGraphIntentScore["scoringVersion"],
    sessionId: row.session_id,
    tier: row.tier
  };
}

async function upsertNode(database: Pool, node: ContactGraphNode) {
  const result = await database.query<GraphNodeIdRow>(
    `
      insert into contact_graph_nodes (
        node_type,
        stable_key,
        label,
        metadata
      )
      values ($1, $2, $3, $4::jsonb)
      on conflict (stable_key)
      do update set
        node_type = excluded.node_type,
        label = excluded.label,
        metadata = excluded.metadata,
        updated_at = now()
      returning id::text
    `,
    [node.nodeType, node.stableKey, node.label, JSON.stringify(node.metadata)]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Graph node upsert did not return an id.");
  }

  return row.id;
}

export async function rebuildContactGraph(
  options: RebuildContactGraphOptions = {}
): Promise<RebuildContactGraphResult> {
  const graphBuildStartedAt = new Date().toISOString();
  const database = getPool(options);

  logGraphEvent("info", "graph_build_started");

  try {
    const [eventsResult, scoresResult] = await Promise.all([
      database.query<InteractionEventRow>(
        `
          select
            id::text,
            event_type::text,
            executive_slug,
            anonymous_visitor_id,
            session_id,
            source_url,
            referrer,
            device_type,
            browser,
            os,
            created_at
          from interaction_events
          order by anonymous_visitor_id, session_id, executive_slug, created_at asc
        `
      ),
      database.query<IntentScoreRow>(
        `
          select
            id::text,
            anonymous_visitor_id,
            session_id,
            executive_slug,
            score,
            tier::text,
            reason_codes,
            scoring_version,
            event_count,
            first_event_at,
            last_event_at
          from intent_scores
          order by anonymous_visitor_id, session_id, executive_slug
        `
      )
    ]);
    const events = eventsResult.rows.flatMap((row) => {
      const event = toGraphEvent(row);
      return event ? [event] : [];
    });
    const intentScores = scoresResult.rows.flatMap((row) => {
      const score = toGraphIntentScore(row);
      return score ? [score] : [];
    });
    const graph = buildGraphFromEvents({ events, intentScores });
    const nodeIdsByStableKey = new Map<string, string>();

    if (graph.duplicateNodesSkipped > 0) {
      logGraphEvent("info", "duplicate_node_skipped", {
        count: graph.duplicateNodesSkipped
      });
    }

    if (graph.duplicateEdgesSkipped > 0) {
      logGraphEvent("info", "duplicate_edge_skipped", {
        count: graph.duplicateEdgesSkipped
      });
    }

    for (const node of graph.nodes) {
      nodeIdsByStableKey.set(node.stableKey, await upsertNode(database, node));
    }

    logGraphEvent("info", "nodes_created", {
      count: graph.nodes.length
    });

    for (const edge of graph.edges) {
      const sourceNodeId = nodeIdsByStableKey.get(edge.sourceStableKey);
      const targetNodeId = nodeIdsByStableKey.get(edge.targetStableKey);

      if (!sourceNodeId || !targetNodeId) {
        logGraphEvent("warn", "graph_build_failed", {
          reason: "missing_edge_node"
        });
        continue;
      }

      await database.query(
        `
          insert into contact_graph_edges (
            edge_type,
            source_node_id,
            target_node_id,
            weight,
            metadata
          )
          values ($1, $2::uuid, $3::uuid, $4, $5::jsonb)
          on conflict (edge_type, source_node_id, target_node_id)
          do update set
            weight = excluded.weight,
            metadata = excluded.metadata,
            updated_at = now()
        `,
        [
          edge.edgeType,
          sourceNodeId,
          targetNodeId,
          edge.weight,
          JSON.stringify(edge.metadata)
        ]
      );
    }

    logGraphEvent("info", "edges_created", {
      count: graph.edges.length
    });

    for (const snapshot of graph.snapshots) {
      await database.query(
        `
          insert into contact_graph_snapshots (
            executive_slug,
            anonymous_visitor_id,
            session_id,
            total_events,
            highest_intent_score,
            highest_intent_tier,
            engagement_summary,
            last_activity_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8)
          on conflict (executive_slug, anonymous_visitor_id, session_id)
          do update set
            total_events = excluded.total_events,
            highest_intent_score = excluded.highest_intent_score,
            highest_intent_tier = excluded.highest_intent_tier,
            engagement_summary = excluded.engagement_summary,
            last_activity_at = excluded.last_activity_at,
            updated_at = now()
        `,
        [
          snapshot.executiveSlug,
          snapshot.anonymousVisitorId,
          snapshot.sessionId,
          snapshot.totalEvents,
          snapshot.highestIntentScore,
          snapshot.highestIntentTier,
          snapshot.engagementSummary,
          snapshot.lastActivityAt
        ]
      );
    }

    logGraphEvent("info", "snapshots_created", {
      count: graph.snapshots.length
    });

    const graphBuildCompletedAt = new Date().toISOString();

    logGraphEvent("info", "graph_build_completed", {
      edgeCount: graph.edges.length,
      nodeCount: graph.nodes.length,
      snapshotCount: graph.snapshots.length
    });

    return {
      ...graph,
      graphBuildCompletedAt,
      graphBuildStartedAt
    };
  } catch (error) {
    logGraphEvent("error", "graph_build_failed");
    throw error;
  } finally {
    await database.end();
  }
}
