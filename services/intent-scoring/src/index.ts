import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  isExecutiveSlug,
  isInteractionEventType,
  type IntentScoringEvent
} from "@bidayax/types";
import { scoreEventGroup } from "./score-event-group";

export { reasonCodeDescriptions } from "./reason-codes";
export { scoreEventGroup, type ScoreEventGroupInput } from "./score-event-group";
export { eventTypeBaseScores, scoringRules } from "./scoring-rules";
export { getIntentTier, intentTierRanges } from "./tiers";

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

type RecalculateOptions = {
  readonly databaseUrl?: string;
  readonly databaseSsl?: boolean;
  readonly poolMax?: number;
  readonly scoredAt?: string;
};

export type RecalculateIntentScoresResult = {
  readonly groupsRead: number;
  readonly scoresWritten: number;
  readonly scoringStartedAt: string;
  readonly scoringCompletedAt: string;
};

function logScoringEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "executive-intent-scoring",
      event,
      ...details
    })
  );
}

function getPool(options: RecalculateOptions) {
  const connectionString = options.databaseUrl ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to recalculate intent scores.");
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

function toScoringEvent(row: InteractionEventRow): IntentScoringEvent | null {
  if (!isInteractionEventType(row.event_type)) {
    logScoringEvent("warn", "invalid_event_group", {
      field: "event_type"
    });
    return null;
  }

  if (!isExecutiveSlug(row.executive_slug)) {
    logScoringEvent("warn", "invalid_event_group", {
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

function groupKey(event: IntentScoringEvent) {
  return [
    event.anonymousVisitorId,
    event.sessionId,
    event.executiveSlug
  ].join("::");
}

function groupEvents(events: readonly IntentScoringEvent[]) {
  const groups = new Map<string, IntentScoringEvent[]>();

  for (const event of events) {
    const key = groupKey(event);
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.push(event);
    } else {
      groups.set(key, [event]);
    }
  }

  return groups;
}

export async function recalculateIntentScores(
  options: RecalculateOptions = {}
): Promise<RecalculateIntentScoresResult> {
  const scoringStartedAt = new Date().toISOString();
  const scoredAt = options.scoredAt ?? scoringStartedAt;
  const database = getPool(options);

  logScoringEvent("info", "scoring_started");

  try {
    const eventsResult = await database.query<InteractionEventRow>(
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
    );
    const events = eventsResult.rows.flatMap((row) => {
      const event = toScoringEvent(row);
      return event ? [event] : [];
    });
    const groups = groupEvents(events);
    let scoresWritten = 0;

    for (const groupedEvents of groups.values()) {
      const score = scoreEventGroup({
        events: groupedEvents,
        scoredAt
      });

      await database.query(
        `
          insert into intent_scores (
            anonymous_visitor_id,
            session_id,
            executive_slug,
            score,
            tier,
            reason_codes,
            scoring_version,
            event_count,
            first_event_at,
            last_event_at
          )
          values ($1, $2, $3, $4, $5, $6::text[], $7, $8, $9, $10)
          on conflict (anonymous_visitor_id, session_id, executive_slug)
          do update set
            score = excluded.score,
            tier = excluded.tier,
            reason_codes = excluded.reason_codes,
            scoring_version = excluded.scoring_version,
            event_count = excluded.event_count,
            first_event_at = excluded.first_event_at,
            last_event_at = excluded.last_event_at,
            updated_at = now()
        `,
        [
          score.anonymousVisitorId,
          score.sessionId,
          score.executiveSlug,
          score.score,
          score.tier,
          score.reasonCodes,
          score.scoringVersion,
          score.eventCount,
          score.firstEventAt,
          score.lastEventAt
        ]
      );
      scoresWritten += 1;
    }

    const scoringCompletedAt = new Date().toISOString();

    logScoringEvent("info", "scoring_completed", {
      groupsRead: groups.size,
      scoresWritten
    });

    return {
      groupsRead: groups.size,
      scoresWritten,
      scoringCompletedAt,
      scoringStartedAt
    };
  } catch (error) {
    logScoringEvent("error", "scoring_failed");
    throw error;
  } finally {
    await database.end();
  }
}

if (process.argv[1]?.endsWith("index.js")) {
  recalculateIntentScores()
    .then((result) => {
      logScoringEvent("info", "database_write_success", {
        scoresWritten: result.scoresWritten
      });
    })
    .catch(() => {
      logScoringEvent("error", "database_write_failure");
      process.exitCode = 1;
    });
}
