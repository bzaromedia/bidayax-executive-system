import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  isExecutiveSlug,
  isReceptionistChannel,
  isReceptionistInteractionType,
  isReceptionistIntentCategory,
  isReceptionistPriority,
  type DashboardReceptionistAuditEvent,
  type DashboardReceptionistInteraction,
  type DashboardReceptionistIntentBreakdown,
  type DashboardReceptionistLanguageBreakdown,
  type DashboardReceptionistSummary,
  type DashboardReceptionistTask,
  type DashboardStatus,
  type ReceptionistTaskStatus,
  type ReceptionistTaskType
} from "@bidayax/types";
import { executiveLabels } from "../lib/formatters";

type SummaryRow = {
  readonly interaction_count: string | number;
  readonly simulated_count: string | number;
  readonly task_count: string | number;
  readonly escalation_count: string | number;
  readonly language_count: string | number;
};

type InteractionRow = {
  readonly id: string;
  readonly interaction_type: string;
  readonly channel: string;
  readonly status: string;
  readonly language: string;
  readonly dialect: string | null;
  readonly executive_slug: string;
  readonly requester_name: string | null;
  readonly requester_company: string | null;
  readonly request_type: string | null;
  readonly summary: string;
  readonly priority: string;
  readonly provider_status: string | null;
  readonly urgency: string | null;
  readonly callback_time: Date | null;
  readonly meeting_request: string | null;
  readonly audit_timeline: unknown;
  readonly created_at: Date;
};

type TaskRow = {
  readonly id: string;
  readonly task_type: ReceptionistTaskType;
  readonly status: ReceptionistTaskStatus;
  readonly assigned_to: string | null;
  readonly due_at: Date | null;
  readonly priority: string;
  readonly description: string;
  readonly created_at: Date;
};

type LanguageRow = {
  readonly language: string;
  readonly count: string | number;
};

type IntentRow = {
  readonly intent: string;
  readonly count: string | number;
};

export type ReceptionistDashboardData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly summary: DashboardReceptionistSummary;
  readonly interactions: readonly DashboardReceptionistInteraction[];
  readonly tasks: readonly DashboardReceptionistTask[];
  readonly languageBreakdown: readonly DashboardReceptionistLanguageBreakdown[];
  readonly intentBreakdown: readonly DashboardReceptionistIntentBreakdown[];
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

function logReceptionistDashboardEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "polyglot-receptionist-dashboard",
      event,
      ...details
    })
  );
}

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function emptySummary(): DashboardReceptionistSummary {
  return {
    escalationCount: 0,
    interactionCount: 0,
    languageCount: 0,
    simulatedCount: 0,
    taskCount: 0
  };
}

function emptyReceptionistData(
  status: DashboardStatus,
  statusMessage: string
): ReceptionistDashboardData {
  return {
    interactions: [],
    intentBreakdown: [],
    languageBreakdown: [],
    status,
    statusMessage,
    summary: emptySummary(),
    tasks: []
  };
}

function normalizeSummary(row: SummaryRow | undefined) {
  if (!row) {
    return emptySummary();
  }

  return {
    escalationCount: parseCount(row.escalation_count),
    interactionCount: parseCount(row.interaction_count),
    languageCount: parseCount(row.language_count),
    simulatedCount: parseCount(row.simulated_count),
    taskCount: parseCount(row.task_count)
  };
}

function isAuditEvent(value: unknown): value is DashboardReceptionistAuditEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Record<string, unknown>;

  return typeof event.eventType === "string";
}

function normalizeAuditTimeline(value: unknown): readonly DashboardReceptionistAuditEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isAuditEvent).map((event) => ({
    createdAt: typeof event.createdAt === "string" ? event.createdAt : null,
    eventType: event.eventType,
    status: typeof event.status === "string" ? event.status : null,
    summary: typeof event.summary === "string" ? event.summary : null
  }));
}

function normalizeInteractions(
  rows: readonly InteractionRow[]
): readonly DashboardReceptionistInteraction[] {
  return rows.flatMap((row) => {
    if (!isReceptionistInteractionType(row.interaction_type)) {
      logReceptionistDashboardEvent("warn", "invalid_receptionist_data", {
        field: "interaction_type"
      });
      return [];
    }

    if (!isReceptionistChannel(row.channel)) {
      logReceptionistDashboardEvent("warn", "invalid_receptionist_data", {
        field: "channel"
      });
      return [];
    }

    if (!isReceptionistPriority(row.priority)) {
      logReceptionistDashboardEvent("warn", "invalid_receptionist_data", {
        field: "priority"
      });
      return [];
    }

    if (!isExecutiveSlug(row.executive_slug)) {
      logReceptionistDashboardEvent("warn", "invalid_receptionist_data", {
        field: "executive_slug"
      });
      return [];
    }

    return [
      {
        auditTimeline: normalizeAuditTimeline(row.audit_timeline),
        callbackTime: row.callback_time?.toISOString() ?? null,
        channel: row.channel,
        createdAt: row.created_at.toISOString(),
        dialect: row.dialect,
        executiveName: executiveLabels[row.executive_slug],
        executiveSlug: row.executive_slug,
        followUpState: row.status,
        id: row.id,
        interactionType: row.interaction_type,
        language: row.language,
        meetingRequest: row.meeting_request,
        priority: row.priority,
        providerStatus: row.provider_status,
        requesterCompany: row.requester_company,
        requesterName: row.requester_name,
        requestType: row.request_type,
        status: row.status,
        summary: row.summary,
        urgency: row.urgency
      }
    ];
  });
}

function normalizeTasks(rows: readonly TaskRow[]): readonly DashboardReceptionistTask[] {
  return rows.flatMap((row) => {
    if (!isReceptionistPriority(row.priority)) {
      logReceptionistDashboardEvent("warn", "invalid_receptionist_data", {
        field: "task_priority"
      });
      return [];
    }

    return [
      {
        assignedTo: row.assigned_to,
        createdAt: row.created_at.toISOString(),
        description: row.description,
        dueAt: row.due_at?.toISOString() ?? null,
        id: row.id,
        priority: row.priority,
        status: row.status,
        taskType: row.task_type
      }
    ];
  });
}

function normalizeLanguageBreakdown(
  rows: readonly LanguageRow[]
): readonly DashboardReceptionistLanguageBreakdown[] {
  const total = rows.reduce((sum, row) => sum + parseCount(row.count), 0);

  return rows.map((row) => {
    const count = parseCount(row.count);

    return {
      count,
      language: row.language,
      share: total > 0 ? count / total : 0
    };
  });
}

function normalizeIntentBreakdown(
  rows: readonly IntentRow[]
): readonly DashboardReceptionistIntentBreakdown[] {
  return rows.flatMap((row) => {
    if (!isReceptionistIntentCategory(row.intent)) {
      logReceptionistDashboardEvent("warn", "invalid_receptionist_data", {
        field: "intent"
      });
      return [];
    }

    return [
      {
        count: parseCount(row.count),
        intent: row.intent
      }
    ];
  });
}

export async function getReceptionistDashboardData(): Promise<ReceptionistDashboardData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyReceptionistData(
      "not_configured",
      "DATABASE_URL is not configured. Receptionist workflow data will appear after PostgreSQL is connected."
    );
  }

  try {
    const [summaryResult, interactionResult, taskResult, languageResult, intentResult] =
      await Promise.all([
        database.query<SummaryRow>(
          `
            select
              (select count(*)::bigint from receptionist_interactions) as interaction_count,
              (select count(*)::bigint from receptionist_interactions where status = 'simulated') as simulated_count,
              (select count(*)::bigint from receptionist_tasks) as task_count,
              (
                select count(*)::bigint
                from receptionist_workflow_events
                where event_type = 'escalation_recommended'
              ) as escalation_count,
              (select count(distinct language)::bigint from receptionist_interactions) as language_count
          `
        ),
        database.query<InteractionRow>(
          `
            select
              receptionist_interactions.id::text,
              interaction_type,
              channel,
              status,
              language,
              dialect,
              executive_slug,
              caller_or_sender as requester_name,
              intent_payload.payload->>'company' as requester_company,
              coalesce(intent_payload.payload->>'requestType', intent_payload.payload->>'intent') as request_type,
              summary,
              priority,
              provider_payload.payload->>'providerStatus' as provider_status,
              urgency_payload.payload->>'urgency' as urgency,
              task_payload.due_at as callback_time,
              case
                when task_payload.task_type = 'schedule_meeting' then 'meeting request queued'
                when task_payload.task_type = 'return_call' then 'callback request queued'
                else null
              end as meeting_request,
              coalesce(audit_payload.audit_timeline, '[]'::jsonb) as audit_timeline,
              receptionist_interactions.created_at
            from receptionist_interactions
            left join lateral (
              select payload
              from receptionist_workflow_events
              where
                receptionist_workflow_events.interaction_id = receptionist_interactions.id
                and receptionist_workflow_events.event_type = 'intent_classified'
              order by created_at desc
              limit 1
            ) intent_payload on true
            left join lateral (
              select payload
              from receptionist_workflow_events
              where
                receptionist_workflow_events.interaction_id = receptionist_interactions.id
                and receptionist_workflow_events.event_type = 'dashboard_visibility'
              order by created_at desc
              limit 1
            ) provider_payload on true
            left join lateral (
              select payload
              from receptionist_workflow_events
              where
                receptionist_workflow_events.interaction_id = receptionist_interactions.id
                and receptionist_workflow_events.event_type = 'score_urgency'
              order by created_at desc
              limit 1
            ) urgency_payload on true
            left join lateral (
              select task_type, due_at
              from receptionist_tasks
              where receptionist_tasks.interaction_id = receptionist_interactions.id
              order by created_at desc
              limit 1
            ) task_payload on true
            left join lateral (
              select jsonb_agg(
                jsonb_build_object(
                  'eventType', event_type,
                  'status', payload->>'status',
                  'summary', payload->>'summary',
                  'createdAt', created_at::text
                )
                order by created_at asc
              ) as audit_timeline
              from receptionist_workflow_events
              where receptionist_workflow_events.interaction_id = receptionist_interactions.id
            ) audit_payload on true
            order by receptionist_interactions.created_at desc
            limit 8
          `
        ),
        database.query<TaskRow>(
          `
            select
              id::text,
              task_type,
              status,
              assigned_to,
              due_at,
              priority,
              description,
              created_at
            from receptionist_tasks
            order by created_at desc
            limit 8
          `
        ),
        database.query<LanguageRow>(
          `
            select language, count(*)::bigint as count
            from receptionist_interactions
            group by language
            order by count desc, language asc
          `
        ),
        database.query<IntentRow>(
          `
            select payload->>'intent' as intent, count(*)::bigint as count
            from receptionist_workflow_events
            where event_type = 'intent_classified'
            group by intent
            order by count desc, intent asc
          `
        )
      ]);
    const data = {
      interactions: normalizeInteractions(interactionResult.rows),
      intentBreakdown: normalizeIntentBreakdown(intentResult.rows),
      languageBreakdown: normalizeLanguageBreakdown(languageResult.rows),
      status: "ready",
      statusMessage: "Showing receptionist workflow foundation and card intake requests.",
      summary: normalizeSummary(summaryResult.rows[0]),
      tasks: normalizeTasks(taskResult.rows)
    } satisfies ReceptionistDashboardData;

    logReceptionistDashboardEvent("info", "receptionist_query_success", {
      interactionCount: data.summary.interactionCount,
      taskCount: data.summary.taskCount
    });

    if (data.summary.interactionCount === 0) {
      logReceptionistDashboardEvent("info", "empty_data_state", {
        reason: "no_receptionist_interactions"
      });
    }

    return data;
  } catch {
    logReceptionistDashboardEvent("error", "receptionist_query_failure");

    return emptyReceptionistData(
      "query_failed",
      "Receptionist foundation queries failed. Run the Phase 8 migration before viewing receptionist workflow data."
    );
  }
}
