import type {
  ExecutiveSlug,
  ReceptionistLanguage,
  ReceptionistPriority,
  ReceptionistRequest,
  ReceptionistRequestType,
  ReceptionistStatus
} from "@bidayax/types";

export const receptionistWorkflowStages = [
  "receive_request",
  "validate_consent",
  "classify_language",
  "classify_request_type",
  "score_urgency",
  "route_to_executive",
  "create_event_ledger_record",
  "create_callback_or_meeting_request",
  "prepare_email_notification",
  "provider_dispatch_if_configured",
  "dashboard_visibility",
  "audit_log"
] as const;

export type ReceptionistWorkflowStage = (typeof receptionistWorkflowStages)[number];

export const receptionistProviderStatuses = [
  "configured",
  "provider_unconfigured",
  "queued",
  "sent",
  "failed",
  "blocked_by_policy",
  "requires_human_review"
] as const;

export type ReceptionistProviderStatus =
  (typeof receptionistProviderStatuses)[number];

export type ReceptionistWorkflowSource =
  | "web_form"
  | "inbound_call"
  | "callback_request"
  | "calendar_request";

export type ReceptionistProviderConfig = {
  readonly telephonyConfigured: boolean;
  readonly emailConfigured: boolean;
  readonly calendarConfigured: boolean;
  readonly emailDispatchEnabled: boolean;
  readonly calendarDispatchEnabled: boolean;
  readonly telephonyDispatchEnabled: boolean;
};

export type ReceptionistWorkflowInput = {
  readonly request: ReceptionistRequest;
  readonly executiveName: string;
  readonly handoffEmail: string;
  readonly source: ReceptionistWorkflowSource;
  readonly anonymousVisitorId?: string | null;
  readonly sessionId?: string | null;
  readonly sourceUrl?: string | null;
  readonly providerConfig?: Partial<ReceptionistProviderConfig> | undefined;
  readonly rateLimitKey?: string | undefined;
  readonly now?: number | undefined;
};

export type ReceptionistNode = {
  readonly id: ReceptionistWorkflowStage;
  readonly label: string;
  readonly requiresHumanApproval: boolean;
};

export type ReceptionistEdge = {
  readonly from: ReceptionistWorkflowStage;
  readonly to: ReceptionistWorkflowStage;
};

export type ReceptionistWorkflow = {
  readonly workflowId: "polyglot-receptionist-live-workflow";
  readonly version: "1.0.0";
  readonly nodes: readonly ReceptionistNode[];
  readonly edges: readonly ReceptionistEdge[];
};

export type ReceptionistRunStep = {
  readonly stage: ReceptionistWorkflowStage;
  readonly status: ReceptionistProviderStatus;
  readonly summary: string;
  readonly metadata: Record<string, string | number | boolean | null>;
};

export type ReceptionistDecision = {
  readonly requestType: ReceptionistRequestType;
  readonly language: ReceptionistLanguage;
  readonly executiveSlug: ExecutiveSlug;
  readonly urgency: ReceptionistPriority;
  readonly requiresHumanReview: boolean;
  readonly reasonCodes: readonly string[];
};

export type ReceptionistRun = {
  readonly runId: string;
  readonly workflow: ReceptionistWorkflow;
  readonly providerStatus: ReceptionistStatus;
  readonly providerStates: Record<string, ReceptionistProviderStatus>;
  readonly decision: ReceptionistDecision;
  readonly steps: readonly ReceptionistRunStep[];
  readonly auditEvents: readonly ReceptionistRunStep[];
  readonly notificationPayload: {
    readonly to: string;
    readonly subject: string;
    readonly body: string;
  };
  readonly callbackRequest: Record<string, string | boolean | null> | null;
  readonly calendarRequest: Record<string, string | boolean | null> | null;
  readonly blockedReasonCodes: readonly string[];
};

export const receptionistWorkflowDefinition: ReceptionistWorkflow = {
  workflowId: "polyglot-receptionist-live-workflow",
  version: "1.0.0",
  nodes: receptionistWorkflowStages.map((stage) => ({
    id: stage,
    label: stage
      .split("_")
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" "),
    requiresHumanApproval: stage === "provider_dispatch_if_configured"
  })),
  edges: receptionistWorkflowStages.slice(0, -1).map((stage, index) => ({
    from: stage,
    to: receptionistWorkflowStages[index + 1] ?? "audit_log"
  }))
};

