import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  executiveSlugs,
  interactionEventTypes,
  isExecutiveSlug,
  isInteractionEventType,
  type DashboardDailyCount,
  type DashboardRecentInteraction,
  type ExecutiveInteractionDashboardData,
  type ExecutiveSlug,
  type InteractionEventType
} from "@bidayax/types";
import { buildDashboardData, createEmptyDashboardData } from "../lib/dashboard-metrics";
import { executiveLabels } from "../lib/formatters";

type CountByTypeRow = {
  readonly event_type: string;
  readonly count: string | number;
};

type CountByExecutiveRow = {
  readonly executive_slug: string;
  readonly count: string | number;
};

type RecentInteractionRow = {
  readonly id: string;
  readonly event_type: string;
  readonly executive_slug: string;
  readonly device_type: string | null;
  readonly browser: string | null;
  readonly os: string | null;
  readonly source_url: string | null;
  readonly referrer: string | null;
  readonly created_at: Date;
};

type DailyCountRow = {
  readonly event_date: string | Date;
  readonly count: string | number;
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

function logDashboardEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "executive-interaction-dashboard",
      event,
      ...details
    })
  );
}

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function emptyEventCounts() {
  return new Map<InteractionEventType, number>(
    interactionEventTypes.map((eventType) => [eventType, 0])
  );
}

function emptyExecutiveCounts() {
  return new Map<ExecutiveSlug, number>(
    executiveSlugs.map((executiveSlug) => [executiveSlug, 0])
  );
}

function normalizeEventCounts(rows: readonly CountByTypeRow[]) {
  const counts = emptyEventCounts();

  for (const row of rows) {
    if (!isInteractionEventType(row.event_type)) {
      logDashboardEvent("warn", "invalid_event_data", {
        field: "event_type"
      });
      continue;
    }

    counts.set(row.event_type, parseCount(row.count));
  }

  return counts;
}

function normalizeExecutiveCounts(rows: readonly CountByExecutiveRow[]) {
  const counts = emptyExecutiveCounts();

  for (const row of rows) {
    if (!isExecutiveSlug(row.executive_slug)) {
      logDashboardEvent("warn", "invalid_event_data", {
        field: "executive_slug"
      });
      continue;
    }

    counts.set(row.executive_slug, parseCount(row.count));
  }

  return counts;
}

function normalizeRecentInteractions(
  rows: readonly RecentInteractionRow[]
): readonly DashboardRecentInteraction[] {
  return rows.flatMap((row) => {
    if (!isInteractionEventType(row.event_type)) {
      logDashboardEvent("warn", "invalid_event_data", {
        field: "event_type"
      });
      return [];
    }

    if (!isExecutiveSlug(row.executive_slug)) {
      logDashboardEvent("warn", "invalid_event_data", {
        field: "executive_slug"
      });
      return [];
    }

    return [
      {
        browser: row.browser ?? "unknown",
        createdAt: row.created_at.toISOString(),
        deviceType: row.device_type ?? "unknown",
        eventType: row.event_type,
        executiveName: executiveLabels[row.executive_slug],
        executiveSlug: row.executive_slug,
        id: row.id,
        os: row.os ?? "unknown",
        referrer: row.referrer,
        sourceUrl: row.source_url
      }
    ];
  });
}

function normalizeDailyCounts(
  rows: readonly DailyCountRow[]
): readonly DashboardDailyCount[] {
  return rows.map((row) => {
    const date =
      row.event_date instanceof Date
        ? row.event_date.toISOString().slice(0, 10)
        : row.event_date;

    return {
      count: parseCount(row.count),
      date
    };
  });
}

export async function getDashboardData(): Promise<ExecutiveInteractionDashboardData> {
  const database = getDatabasePool();

  if (!database) {
    logDashboardEvent("warn", "empty_data_state", {
      reason: "database_url_not_configured"
    });

    return createEmptyDashboardData(
      "not_configured",
      "DATABASE_URL is not configured. Connect PostgreSQL to view ledger activity."
    );
  }

  try {
    const [eventCounts, executiveCounts, recentInteractions, dailyCounts] =
      await Promise.all([
        database.query<CountByTypeRow>(
          `
            select event_type::text, count(*)::bigint as count
            from interaction_events
            group by event_type
            order by event_type
          `
        ),
        database.query<CountByExecutiveRow>(
          `
            select executive_slug, count(*)::bigint as count
            from interaction_events
            group by executive_slug
            order by executive_slug
          `
        ),
        database.query<RecentInteractionRow>(
          `
            select
              id::text,
              event_type::text,
              executive_slug,
              device_type,
              browser,
              os,
              source_url,
              referrer,
              created_at
            from interaction_events
            order by created_at desc
            limit 12
          `
        ),
        database.query<DailyCountRow>(
          `
            select
              date_trunc('day', created_at)::date as event_date,
              count(*)::bigint as count
            from interaction_events
            where created_at >= now() - interval '14 days'
            group by event_date
            order by event_date asc
          `
        )
      ]);
    const data = buildDashboardData({
      dailyCounts: normalizeDailyCounts(dailyCounts.rows),
      eventCounts: normalizeEventCounts(eventCounts.rows),
      executiveCounts: normalizeExecutiveCounts(executiveCounts.rows),
      recentInteractions: normalizeRecentInteractions(recentInteractions.rows),
      status: "ready",
      statusMessage: "Showing interaction_events ledger activity."
    });

    logDashboardEvent("info", "dashboard_query_success", {
      recentInteractionCount: data.recentInteractions.length,
      totalInteractions: data.totalInteractions
    });

    if (data.totalInteractions === 0) {
      logDashboardEvent("info", "empty_data_state", {
        reason: "no_interaction_events"
      });
    }

    return data;
  } catch {
    logDashboardEvent("error", "dashboard_query_failure");

    return createEmptyDashboardData(
      "query_failed",
      "Dashboard queries failed. Check DATABASE_URL, migration state, and database reachability."
    );
  }
}
