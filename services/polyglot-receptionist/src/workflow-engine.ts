import type { ReceptionistPriority } from "@bidayax/types";
import { createReceptionistAuditEvent } from "./audit-log";
import { createCalendarRequest } from "./calendar-request-handler";
import { createCallbackRequest } from "./callback-scheduler";
import { createReceptionistEmailNotification } from "./email-dispatcher";
import { qualifyReceptionistLead } from "./lead-qualification";
import { calculateVoiceTrustScore } from "./voice-trust-score";
import { classifyReceptionistLanguage } from "./language-router";
import { evaluateReceptionistRateLimit } from "./rate-limit-policy";
import { routeReceptionistRequestToExecutive } from "./receptionist-router";
import { evaluateReceptionistSafety } from "./receptionist-safety";
import {
  receptionistWorkflowDefinition,
  type ReceptionistProviderConfig,
  type ReceptionistProviderStatus,
  type ReceptionistRun,
  type ReceptionistRunStep,
  type ReceptionistWorkflowInput,
  type ReceptionistWorkflowStage
} from "./workflow-nodes";

function createRunId(now: number) {
  return `receptionist-run-${now}-${Math.random().toString(36).slice(2, 10)}`;
}

function step(
  stage: ReceptionistWorkflowStage,
  status: ReceptionistProviderStatus,
  summary: string,
  metadata: Record<string, string | number | boolean | null> = {}
): ReceptionistRunStep {
  return {
    metadata,
    stage,
    status,
    summary
  };
}

function requestTypeToCallIntent(requestType: ReceptionistWorkflowInput["request"]["requestType"]) {
  const mapping = {
    general_inquiry: "unknown",
    partnership_request: "partner",
    qualify_lead: "sales",
    request_callback: "customer",
    route_message: "unknown",
    schedule_meeting: "customer",
    support_request: "customer"
  } as const;

  return mapping[requestType];
}

function statusForCommandSubmission(input: {
  readonly emailConfigured: boolean;
  readonly emailDispatchEnabled: boolean;
  readonly requiresHumanReview: boolean;
}): ReceptionistProviderStatus {
  if (!input.emailConfigured) {
    return "provider_unconfigured";
  }

  if (input.requiresHumanReview) {
    return "requires_human_review";
  }

  return input.emailDispatchEnabled ? "queued" : "configured";
}

function getProviderConfig(
  input: ReceptionistWorkflowInput["providerConfig"]
): ReceptionistProviderConfig {
  return {
    calendarConfigured: input?.calendarConfigured ?? false,
    calendarDispatchEnabled: input?.calendarDispatchEnabled ?? false,
    emailConfigured: input?.emailConfigured ?? false,
    emailDispatchEnabled: input?.emailDispatchEnabled ?? false,
    telephonyConfigured: input?.telephonyConfigured ?? false,
    telephonyDispatchEnabled: input?.telephonyDispatchEnabled ?? false
  };
}

export function runReceptionistWorkflow(
  input: ReceptionistWorkflowInput
): ReceptionistRun {
  const now = input.now ?? Date.now();
  const runId = createRunId(now);
  const providerConfig = getProviderConfig(input.providerConfig);
  const steps: ReceptionistRunStep[] = [];
  const rateLimit = input.rateLimitKey
    ? evaluateReceptionistRateLimit({ key: input.rateLimitKey, now })
    : { allowed: true, remaining: 1, resetAt: now, reasonCode: null };
  const safety = evaluateReceptionistSafety(input.request);
  const language = classifyReceptionistLanguage(input.request.preferredLanguage);
  const lead = qualifyReceptionistLead(input.request);
  const trust = calculateVoiceTrustScore({
    caller: {
      callerId: input.request.email.toLowerCase(),
      company: input.request.company ?? null,
      email: input.request.email,
      lastContactAt: null,
      name: input.request.name,
      phone: input.request.phone ?? "unknown",
      repeatContactCount: input.request.company ? 1 : 0,
      verifiedIdentity: Boolean(input.request.email && input.request.company)
    },
    companyMatchesExecutiveContext: Boolean(input.request.company),
    intent: requestTypeToCallIntent(input.request.requestType),
    languageConfidence: 0.85,
    sentiment: "neutral",
    spamRiskScore: 0
  });
  const route = routeReceptionistRequestToExecutive({
    executiveSlug: input.request.executiveSlug,
    handoffEmail: input.handoffEmail,
    request: input.request
  });
  const requiresHumanReview =
    lead.urgency === "high" || lead.urgency === "urgent" || input.request.requestType === "partnership_request";
  const notificationPayload = createReceptionistEmailNotification({
    executiveName: input.executiveName,
    handoffEmail: route.handoffEmail,
    request: {
      ...input.request,
      message: safety.sanitizedMessage
    }
  });
  const callbackRequest = createCallbackRequest(input.request);
  const calendarRequest = createCalendarRequest(input.request);

  steps.push(
    step("receive_request", "queued", "Receptionist workflow request received.", {
      source: input.source,
      requestType: input.request.requestType
    })
  );

  if (!rateLimit.allowed) {
    steps.push(
      step("validate_consent", "blocked_by_policy", "Request blocked by rate limit policy.", {
        reasonCode: rateLimit.reasonCode,
        resetAt: rateLimit.resetAt
      })
    );
  } else if (!safety.allowed) {
    steps.push(
      step("validate_consent", "blocked_by_policy", "Request blocked by safety policy.", {
        reasonCodes: safety.reasonCodes.join(",")
      })
    );
  } else {
    steps.push(
      step("validate_consent", "queued", "Consent and safety checks passed.", {
        consent: input.request.consent,
        remainingRateLimit: rateLimit.remaining
      })
    );
  }

  const blockedReasonCodes = [
    ...(rateLimit.allowed ? [] : [rateLimit.reasonCode ?? "rate_limit_exceeded"]),
    ...safety.reasonCodes
  ];
  const blocked = blockedReasonCodes.length > 0;

  steps.push(
    step("classify_language", blocked ? "blocked_by_policy" : "queued", "Language classified for routing.", {
      dialect: input.request.dialect ?? null,
      language
    }),
    step("classify_request_type", blocked ? "blocked_by_policy" : "queued", "Request type classified.", {
      requestType: input.request.requestType
    }),
    step("score_urgency", blocked ? "blocked_by_policy" : "queued", "Urgency and voice trust scores calculated.", {
      score: lead.score,
      trustScore: trust.score,
      trustTier: trust.tier,
      urgency: lead.urgency
    }),
    step("route_to_executive", blocked ? "blocked_by_policy" : "queued", "Request routed to executive owner.", {
      executiveSlug: route.executiveSlug,
      handoffEmail: route.handoffEmail
    }),
    step("create_event_ledger_record", blocked ? "blocked_by_policy" : "queued", "Event ledger record prepared for persistence.", {
      anonymousVisitorId: input.anonymousVisitorId ?? null,
      sessionId: input.sessionId ?? null
    }),
    step("create_callback_or_meeting_request", blocked ? "blocked_by_policy" : "queued", "Internal callback or meeting request prepared when applicable.", {
      callbackRequested: Boolean(callbackRequest),
      meetingRequested: Boolean(calendarRequest)
    }),
    step("prepare_email_notification", blocked ? "blocked_by_policy" : "queued", "Email notification payload prepared for communications handoff.", {
      handoffConfigured: providerConfig.emailConfigured,
      to: notificationPayload.to
    })
  );

  const providerStatus = blocked
    ? "blocked_by_policy"
    : statusForCommandSubmission({
        emailConfigured: providerConfig.emailConfigured,
        emailDispatchEnabled: providerConfig.emailDispatchEnabled,
        requiresHumanReview
      });

  steps.push(
    step(
      "submit_communications_command",
      providerStatus === "configured" ? "queued" : providerStatus,
      providerConfig.emailConfigured
        ? "Communications handoff is configured and remains policy-gated."
        : "Communications handoff is not configured; request remains queued internally.",
      {
        calendarConfigured: providerConfig.calendarConfigured,
        emailConfigured: providerConfig.emailConfigured,
        telephonyConfigured: providerConfig.telephonyConfigured
      }
    ),
    step("dashboard_visibility", providerStatus, "Workflow is visible in the dashboard queue.", {
      providerStatus,
      requiresHumanReview
    }),
    step("audit_log", providerStatus, "Workflow audit trail completed.", {
      runId
    })
  );

  const decision = {
    executiveSlug: input.request.executiveSlug,
    language,
    reasonCodes: [...lead.reasonCodes, ...(requiresHumanReview ? ["human_review_required"] : [])],
    requestType: input.request.requestType,
    requiresHumanReview,
    urgency: lead.urgency as ReceptionistPriority
  };

  return {
    auditEvents: steps.map(createReceptionistAuditEvent).map((event) =>
      step(event.eventType as ReceptionistWorkflowStage, providerStatus, String(event.payload.summary ?? "Workflow step."), event.payload)
    ),
    blockedReasonCodes: [...new Set(blockedReasonCodes)],
    callbackRequest,
    calendarRequest,
    decision,
    notificationPayload,
    providerStates: {
      calendar: providerConfig.calendarConfigured ? "configured" : "provider_unconfigured",
      email: providerConfig.emailConfigured ? "configured" : "provider_unconfigured",
      telephony: providerConfig.telephonyConfigured ? "configured" : "provider_unconfigured"
    },
    providerStatus,
    runId,
    steps,
    workflow: receptionistWorkflowDefinition
  };
}