import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  isExecutiveSlug,
  isOutboundCallApprovalStatus,
  isOutboundCallRequestStatus,
  isTelephonyCallDirection,
  isTelephonyCallEventType,
  isTelephonyCallStatus,
  isTelephonyProviderName,
  isVoiceSessionStatus,
  type DashboardOutboundCallApproval,
  type DashboardStatus,
  type DashboardTelephonyCallEvent,
  type DashboardTelephonyReadinessSummary,
  type DashboardVoiceSession
} from "@bidayax/types";
import { executiveLabels } from "../lib/formatters";
import { maskPhoneNumber } from "../lib/telephony-formatters";

type SummaryRow = {
  readonly call_count: string | number;
  readonly voice_session_count: string | number;
  readonly pending_approval_count: string | number;
};

type CallEventRow = {
  readonly id: string;
  readonly event_type: string;
  readonly provider: string;
  readonly direction: string;
  readonly status: string;
  readonly executive_slug: string;
  readonly from_number: string | null;
  readonly to_number: string | null;
  readonly created_at: Date;
};

type VoiceSessionRow = {
  readonly id: string;
  readonly provider: string;
  readonly voice_model: string;
  readonly status: string;
  readonly language: string | null;
  readonly transcript_status: string;
  readonly summary_status: string;
  readonly created_at: Date;
};

type OutboundRequestRow = {
  readonly id: string;
  readonly requested_by: string;
  readonly to_number: string;
  readonly executive_slug: string;
  readonly reason: string;
  readonly approval_status: string;
  readonly status: string;
  readonly created_at: Date;
};

export type TelephonyDashboardData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly summary: DashboardTelephonyReadinessSummary;
  readonly callEvents: readonly DashboardTelephonyCallEvent[];
  readonly voiceSessions: readonly DashboardVoiceSession[];
  readonly outboundApprovals: readonly DashboardOutboundCallApproval[];
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

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function getReadinessSummary(row: SummaryRow | undefined) {
  const providerCandidate = process.env.TELEPHONY_PROVIDER ?? "mock";
  const provider = isTelephonyProviderName(providerCandidate)
    ? providerCandidate
    : "mock";

  return {
    callCount: row ? parseCount(row.call_count) : 0,
    outboundCallsEnabled: parseBoolean(process.env.OUTBOUND_CALLS_ENABLED, false),
    pendingApprovalCount: row ? parseCount(row.pending_approval_count) : 0,
    provider,
    providerConfigured:
      provider === "mock" ||
      Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    requireHumanApproval: parseBoolean(process.env.REQUIRE_HUMAN_APPROVAL, true),
    voiceAgentEnabled: parseBoolean(process.env.VOICE_AGENT_ENABLED, false),
    voiceSessionCount: row ? parseCount(row.voice_session_count) : 0
  } satisfies DashboardTelephonyReadinessSummary;
}

function logTelephonyDashboardEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "telephony-readiness-dashboard",
      event,
      ...details
    })
  );
}

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function emptyTelephonyData(
  status: DashboardStatus,
  statusMessage: string
): TelephonyDashboardData {
  return {
    callEvents: [],
    outboundApprovals: [],
    status,
    statusMessage,
    summary: getReadinessSummary(undefined),
    voiceSessions: []
  };
}

function normalizeCallEvents(
  rows: readonly CallEventRow[]
): readonly DashboardTelephonyCallEvent[] {
  return rows.flatMap((row) => {
    if (
      !isTelephonyCallEventType(row.event_type) ||
      !isTelephonyProviderName(row.provider) ||
      !isTelephonyCallDirection(row.direction) ||
      !isTelephonyCallStatus(row.status) ||
      !isExecutiveSlug(row.executive_slug)
    ) {
      logTelephonyDashboardEvent("warn", "invalid_telephony_data", {
        field: "call_event"
      });
      return [];
    }

    return [
      {
        createdAt: row.created_at.toISOString(),
        direction: row.direction,
        eventType: row.event_type,
        executiveName: executiveLabels[row.executive_slug],
        executiveSlug: row.executive_slug,
        id: row.id,
        maskedFromNumber: maskPhoneNumber(row.from_number),
        maskedToNumber: maskPhoneNumber(row.to_number),
        provider: row.provider,
        status: row.status
      }
    ];
  });
}

function normalizeVoiceSessions(
  rows: readonly VoiceSessionRow[]
): readonly DashboardVoiceSession[] {
  return rows.flatMap((row) => {
    if (!isTelephonyProviderName(row.provider) || !isVoiceSessionStatus(row.status)) {
      logTelephonyDashboardEvent("warn", "invalid_telephony_data", {
        field: "voice_session"
      });
      return [];
    }

    return [
      {
        createdAt: row.created_at.toISOString(),
        id: row.id,
        language: row.language,
        provider: row.provider,
        status: row.status,
        summaryStatus: row.summary_status,
        transcriptStatus: row.transcript_status,
        voiceModel: row.voice_model
      }
    ];
  });
}

function normalizeOutboundApprovals(
  rows: readonly OutboundRequestRow[]
): readonly DashboardOutboundCallApproval[] {
  return rows.flatMap((row) => {
    if (
      !isExecutiveSlug(row.executive_slug) ||
      !isOutboundCallApprovalStatus(row.approval_status) ||
      !isOutboundCallRequestStatus(row.status)
    ) {
      logTelephonyDashboardEvent("warn", "invalid_telephony_data", {
        field: "outbound_request"
      });
      return [];
    }

    return [
      {
        approvalStatus: row.approval_status,
        createdAt: row.created_at.toISOString(),
        executiveName: executiveLabels[row.executive_slug],
        executiveSlug: row.executive_slug,
        id: row.id,
        maskedToNumber: maskPhoneNumber(row.to_number) ?? "Masked number",
        reason: row.reason,
        requestedBy: row.requested_by,
        status: row.status
      }
    ];
  });
}

export async function getTelephonyDashboardData(): Promise<TelephonyDashboardData> {
  const database = getDatabasePool();

  if (!database) {
    return emptyTelephonyData(
      "not_configured",
      "DATABASE_URL is not configured. Telephony remains safety-gated with outbound calls disabled, voice agent disabled, and human approval required."
    );
  }

  try {
    const [summaryResult, callEventResult, voiceSessionResult, outboundResult] =
      await Promise.all([
        database.query<SummaryRow>(
          `
            select
              (select count(*)::bigint from telephony_calls) as call_count,
              (select count(*)::bigint from voice_sessions) as voice_session_count,
              (
                select count(*)::bigint
                from outbound_call_requests
                where approval_status = 'pending'
              ) as pending_approval_count
          `
        ),
        database.query<CallEventRow>(
          `
            select
              event.id::text,
              event.event_type,
              call.provider,
              call.direction,
              call.status,
              call.executive_slug,
              call.from_number,
              call.to_number,
              event.created_at
            from telephony_call_events event
            join telephony_calls call on call.id = event.call_id
            order by event.created_at desc
            limit 10
          `
        ),
        database.query<VoiceSessionRow>(
          `
            select
              id::text,
              provider,
              voice_model,
              status,
              language,
              transcript_status,
              summary_status,
              created_at
            from voice_sessions
            order by created_at desc
            limit 8
          `
        ),
        database.query<OutboundRequestRow>(
          `
            select
              id::text,
              requested_by,
              to_number,
              executive_slug,
              reason,
              approval_status,
              status,
              created_at
            from outbound_call_requests
            order by created_at desc
            limit 8
          `
        )
      ]);
    const data = {
      callEvents: normalizeCallEvents(callEventResult.rows),
      outboundApprovals: normalizeOutboundApprovals(outboundResult.rows),
      status: "ready",
      statusMessage: "Showing Phase 9 telephony preparation and safety-gate readiness.",
      summary: getReadinessSummary(summaryResult.rows[0]),
      voiceSessions: normalizeVoiceSessions(voiceSessionResult.rows)
    } satisfies TelephonyDashboardData;

    logTelephonyDashboardEvent("info", "telephony_query_success", {
      callCount: data.summary.callCount,
      pendingApprovalCount: data.summary.pendingApprovalCount
    });

    return data;
  } catch {
    logTelephonyDashboardEvent("error", "telephony_query_failure");

    return emptyTelephonyData(
      "query_failed",
      "Telephony queries failed. Run the Phase 9 migration before viewing call readiness records."
    );
  }
}
