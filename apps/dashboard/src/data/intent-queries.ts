import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  executiveSlugs,
  intentTiers,
  isExecutiveSlug,
  isIntentReasonCode,
  isIntentTier,
  type DashboardExecutiveIntentSummary,
  type DashboardIntentSignal,
  type DashboardIntentTierBreakdown,
  type DashboardStatus,
  type IntentReasonCode,
  type IntentScoringVersion
} from "@bidayax/types";
import { executiveLabels } from "../lib/formatters";

type IntentSignalRow = {
  readonly id: string;
  readonly executive_slug: string;
  readonly score: number;
  readonly tier: string;
  readonly reason_codes: string[];
  readonly scoring_version: string;
  readonly event_count: number;
  readonly last_event_at: Date | null;
};

type TierCountRow = {
  readonly tier: string;
  readonly count: string | number;
};

type ExecutiveIntentRow = {
  readonly executive_slug: string;
  readonly signal_count: string | number;
  readonly average_score: string | number;
  readonly max_score: string | number;
};

export type IntentDashboardData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly topIntentSignals: readonly DashboardIntentSignal[];
  readonly intentTierBreakdown: readonly DashboardIntentTierBreakdown[];
  readonly executiveIntentSummary: readonly DashboardExecutiveIntentSummary[];
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

function logIntentDashboardEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "executive-intent-dashboard",
      event,
      ...details
    })
  );
}

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function parseNumber(value: string | number) {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function emptyTierBreakdown(): DashboardIntentTierBreakdown[] {
  return intentTiers.map((tier) => ({
    count: 0,
    share: 0,
    tier
  }));
}

function emptyExecutiveSummary(): DashboardExecutiveIntentSummary[] {
  return executiveSlugs.map((executiveSlug) => ({
    averageScore: 0,
    executiveName: executiveLabels[executiveSlug],
    executiveSlug,
    maxScore: 0,
    signalCount: 0
  }));
}

function emptyIntentData(
  status: DashboardStatus,
  statusMessage: string
): IntentDashboardData {
  return {
    executiveIntentSummary: emptyExecutiveSummary(),
    intentTierBreakdown: emptyTierBreakdown(),
    status,
    statusMessage,
    topIntentSignals: []
  };
}

function normalizeReasonCodes(values: readonly string[]) {
  return values.filter(isIntentReasonCode) as IntentReasonCode[];
}

function normalizeSignals(
  rows: readonly IntentSignalRow[]
): readonly DashboardIntentSignal[] {
  return rows.flatMap((row, index) => {
    if (!isExecutiveSlug(row.executive_slug)) {
      logIntentDashboardEvent("warn", "invalid_intent_data", {
        field: "executive_slug"
      });
      return [];
    }

    if (!isIntentTier(row.tier)) {
      logIntentDashboardEvent("warn", "invalid_intent_data", {
        field: "tier"
      });
      return [];
    }

    return [
      {
        eventCount: row.event_count,
        executiveName: executiveLabels[row.executive_slug],
        executiveSlug: row.executive_slug,
        id: row.id,
        label: `Anonymous Session #${index + 1}`,
        lastEventAt: row.last_event_at?.toISOString() ?? null,
        reasonCodes: normalizeReasonCodes(row.reason_codes),
        score: row.score,
        scoringVersion: row.scoring_version as IntentScoringVersion,
        tier: row.tier
      }
    ];
  });
}

function normalizeTierBreakdown(
  rows: readonly TierCountRow[]
): readonly DashboardIntentTierBreakdown[] {
  const counts = new Map(rows.map((row) => [row.tier, parseCount(row.count)]));
  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

  return intentTiers.map((tier) => {
    const count = counts.get(tier) ?? 0;

    return {
      count,
      share: total > 0 ? count / total : 0,
      tier
    };
  });
}

function normalizeExecutiveIntentSummary(
  rows: readonly ExecutiveIntentRow[]
): readonly DashboardExecutiveIntentSummary[] {
  const rowMap = new Map(rows.map((row) => [row.executive_slug, row]));

  return executiveSlugs.map((executiveSlug) => {
    const row = rowMap.get(executiveSlug);

    if (row && !isExecutiveSlug(row.executive_slug)) {
      logIntentDashboardEvent("warn", "invalid_intent_data", {
        field: "executive_slug"
      });
    }

    return {
      averageScore: row ? parseNumber(row.average_score) : 0,
      executiveName: executiveLabels[executiveSlug],
      executiveSlug,
      maxScore: row ? parseNumber(row.max_score) : 0,
      signalCount: row ? parseCount(row.signal_count) : 0
    };
  });
}

export async function getIntentDashboardData(): Promise<IntentDashboardData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyIntentData(
      "not_configured",
      "DATABASE_URL is not configured. Intent scores will appear after PostgreSQL is connected and recalculation runs."
    );
  }

  try {
    const [topSignals, tierCounts, executiveSummary] = await Promise.all([
      database.query<IntentSignalRow>(
        `
          select
            id::text,
            executive_slug,
            score,
            tier::text,
            reason_codes,
            scoring_version,
            event_count,
            last_event_at
          from intent_scores
          order by score desc, last_event_at desc
          limit 8
        `
      ),
      database.query<TierCountRow>(
        `
          select tier::text, count(*)::bigint as count
          from intent_scores
          group by tier
        `
      ),
      database.query<ExecutiveIntentRow>(
        `
          select
            executive_slug,
            count(*)::bigint as signal_count,
            coalesce(avg(score), 0)::float as average_score,
            coalesce(max(score), 0)::int as max_score
          from intent_scores
          group by executive_slug
        `
      )
    ]);
    const data = {
      executiveIntentSummary: normalizeExecutiveIntentSummary(
        executiveSummary.rows
      ),
      intentTierBreakdown: normalizeTierBreakdown(tierCounts.rows),
      status: "ready",
      statusMessage: "Showing deterministic intent_scores signals.",
      topIntentSignals: normalizeSignals(topSignals.rows)
    } satisfies IntentDashboardData;

    logIntentDashboardEvent("info", "intent_query_success", {
      topSignalCount: data.topIntentSignals.length
    });

    if (data.topIntentSignals.length === 0) {
      logIntentDashboardEvent("info", "empty_data_state", {
        reason: "no_intent_scores"
      });
    }

    return data;
  } catch {
    logIntentDashboardEvent("error", "intent_query_failure");

    return emptyIntentData(
      "query_failed",
      "Intent score queries failed. Run the Phase 6 migration and recalculation path."
    );
  }
}
