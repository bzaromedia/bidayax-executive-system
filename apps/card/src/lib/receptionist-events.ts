import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import type {
  ExecutiveSlug,
  ReceptionistNotificationPayload,
  ReceptionistRequest,
  ReceptionistRequestType,
  ReceptionistStatus
} from "@bidayax/types";
import type { ReceptionistRun } from "@bidayax/polyglot-receptionist";

type StoreReceptionistRequestInput = {
  readonly anonymousVisitorId: string | null;
  readonly executiveSlug: ExecutiveSlug;
  readonly notification: ReceptionistNotificationPayload;
  readonly providerStatus: ReceptionistStatus;
  readonly request: ReceptionistRequest;
  readonly sessionId: string | null;
  readonly workflowRun?: ReceptionistRun;
};

type StoredRequest = {
  readonly requestId: string;
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

function requestTypeToInteractionType(requestType: ReceptionistRequestType) {
  const mapping = {
    general_inquiry: "website_inquiry",
    partnership_request: "website_inquiry",
    qualify_lead: "website_inquiry",
    request_callback: "inbound_call",
    route_message: "email",
    schedule_meeting: "scheduling_request",
    support_request: "website_inquiry"
  } as const satisfies Record<ReceptionistRequestType, string>;

  return mapping[requestType];
}

function requestTypeToTaskType(requestType: ReceptionistRequestType) {
  const mapping = {
    general_inquiry: "send_email",
    partnership_request: "escalate_to_executive",
    qualify_lead: "qualify_lead",
    request_callback: "return_call",
    route_message: "send_email",
    schedule_meeting: "schedule_meeting",
    support_request: "create_follow_up"
  } as const satisfies Record<ReceptionistRequestType, string>;

  return mapping[requestType];
}

function requestTypeToPriority(requestType: ReceptionistRequestType) {
  return requestType === "partnership_request" || requestType === "qualify_lead"
    ? "high"
    : "medium";
}

function previewMessage(message: string) {
  return message.trim().slice(0, 240);
}

function logReceptionistEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "polyglot-receptionist-request",
      event,
      ...details
    })
  );
}

async function writeLedgerEvent(
  database: Pool,
  input: StoreReceptionistRequestInput,
  eventType:
    | "receptionist_request_submitted"
    | "receptionist_meeting_requested"
    | "receptionist_callback_requested"
    | "receptionist_lead_qualified"
) {
  await database.query(
    `
      insert into interaction_events (
        event_type,
        executive_slug,
        session_id,
        anonymous_visitor_id,
        source_url,
        metadata
      )
      values (
        $1::interaction_event_type,
        $2,
        $3,
        $4,
        $5,
        $6::jsonb
      )
    `,
    [
      eventType,
      input.executiveSlug,
      input.sessionId ?? `server-${randomUUID()}`,
      input.anonymousVisitorId ?? `server-${randomUUID()}`,
      null,
      JSON.stringify({
        providerStatus: input.providerStatus,
        requestType: input.request.requestType,
        route: "/api/receptionist/request",
        surface: "executive_receptionist_card"
      })
    ]
  );
}

async function writeRequestRows(database: Pool, input: StoreReceptionistRequestInput) {
  const priority = requestTypeToPriority(input.request.requestType);
  const interactionResult = await database.query<StoredRequest>(
    `
      insert into receptionist_interactions (
        interaction_type,
        channel,
        status,
        language,
        dialect,
        caller_or_sender,
        executive_slug,
        anonymous_visitor_id,
        session_id,
        summary,
        sentiment,
        priority
      )
      values ($1, 'web', 'received', $2, $3, $4, $5, $6, $7, $8, 'neutral', $9)
      returning id::text as "requestId"
    `,
    [
      requestTypeToInteractionType(input.request.requestType),
      input.request.preferredLanguage,
      input.request.dialect ?? null,
      input.request.name,
      input.executiveSlug,
      input.anonymousVisitorId,
      input.sessionId,
      previewMessage(input.request.message),
      priority
    ]
  );
  const requestId = interactionResult.rows[0]?.requestId ?? randomUUID();

  await database.query(
    `
      insert into receptionist_conversation_turns (
        interaction_id,
        speaker,
        language,
        text,
        sequence_number
      )
      values ($1::uuid, 'visitor', $2, $3, 1)
    `,
    [requestId, input.request.preferredLanguage, input.request.message]
  );

  await database.query(
    `
      insert into receptionist_tasks (
        interaction_id,
        task_type,
        status,
        priority,
        description
      )
      values ($1::uuid, $2, 'pending', $3, $4)
    `,
    [
      requestId,
      requestTypeToTaskType(input.request.requestType),
      priority,
      `${input.request.name}${input.request.company ? ` at ${input.request.company}` : ""}: ${previewMessage(input.request.message)}`
    ]
  );

  await database.query(
    `
      insert into receptionist_workflow_events (interaction_id, event_type, payload)
      values
        ($1::uuid, 'interaction_created', $2::jsonb),
        ($1::uuid, 'intent_classified', $3::jsonb),
        ($1::uuid, 'task_created', $4::jsonb)
    `,
    [
      requestId,
      JSON.stringify({
        providerStatus: input.providerStatus,
        requestType: input.request.requestType,
        workflowRunId: input.workflowRun?.runId ?? null
      }),
      JSON.stringify({
        company: input.request.company ?? null,
        intent: input.request.requestType,
        language: input.request.preferredLanguage,
        urgency: input.workflowRun?.decision.urgency ?? priority
      }),
      JSON.stringify({
        notificationSubject: input.notification.subject,
        notificationTo: input.notification.to,
        providerStatus: input.providerStatus
      })
    ]
  );

  if (input.workflowRun) {
    for (const workflowStep of input.workflowRun.steps) {
      await database.query(
        `
          insert into receptionist_workflow_events (interaction_id, event_type, payload)
          values ($1::uuid, $2, $3::jsonb)
        `,
        [
          requestId,
          workflowStep.stage,
          JSON.stringify({
            ...workflowStep.metadata,
            providerStatus: input.providerStatus,
            runId: input.workflowRun.runId,
            status: workflowStep.status,
            summary: workflowStep.summary
          })
        ]
      );
    }
  }

  return requestId;
}

export async function storeReceptionistRequest(
  input: StoreReceptionistRequestInput
) {
  const database = getDatabasePool();

  if (!database) {
    logReceptionistEvent("warn", "database_unavailable", {
      executiveSlug: input.executiveSlug,
      requestType: input.request.requestType
    });

    return {
      providerStatus: "event_store_unavailable" as const,
      requestId: randomUUID()
    };
  }

  try {
    const requestId = await writeRequestRows(database, input);

    await writeLedgerEvent(database, input, "receptionist_request_submitted");

    if (input.request.requestType === "schedule_meeting") {
      await writeLedgerEvent(database, input, "receptionist_meeting_requested");
    }

    if (input.request.requestType === "request_callback") {
      await writeLedgerEvent(database, input, "receptionist_callback_requested");
    }

    if (input.request.requestType === "qualify_lead") {
      await writeLedgerEvent(database, input, "receptionist_lead_qualified");
    }

    logReceptionistEvent("info", "request_stored", {
      executiveSlug: input.executiveSlug,
      requestType: input.request.requestType
    });

    return {
      providerStatus: input.providerStatus,
      requestId
    };
  } catch {
    logReceptionistEvent("error", "request_store_failed", {
      executiveSlug: input.executiveSlug,
      requestType: input.request.requestType
    });

    return {
      providerStatus: "event_store_unavailable" as const,
      requestId: randomUUID()
    };
  }
}

