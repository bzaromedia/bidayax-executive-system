import type { ExecutiveSlug } from "./events";

export const telephonyProviders = ["mock", "twilio"] as const;

export type TelephonyProviderName = (typeof telephonyProviders)[number];

export const telephonyCallDirections = ["inbound", "outbound"] as const;

export type TelephonyCallDirection = (typeof telephonyCallDirections)[number];

export const telephonyCallStatuses = [
  "simulated",
  "received",
  "queued",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
  "blocked",
  "requires_approval"
] as const;

export type TelephonyCallStatus = (typeof telephonyCallStatuses)[number];

export const telephonyCallEventTypes = [
  "call_received",
  "call_validated",
  "call_linked_to_receptionist_interaction",
  "call_started",
  "call_in_progress",
  "call_completed",
  "call_failed",
  "outbound_call_requested",
  "outbound_call_blocked",
  "approval_required",
  "approval_granted",
  "approval_denied"
] as const;

export type TelephonyCallEventType = (typeof telephonyCallEventTypes)[number];

export const voiceSessionStatuses = [
  "not_started",
  "prepared",
  "active",
  "completed",
  "failed",
  "blocked"
] as const;

export type VoiceSessionStatus = (typeof voiceSessionStatuses)[number];

export const transcriptStatuses = [
  "none",
  "pending",
  "partial",
  "completed",
  "failed"
] as const;

export type TranscriptStatus = (typeof transcriptStatuses)[number];

export const summaryStatuses = [
  "none",
  "pending",
  "completed",
  "failed"
] as const;

export type SummaryStatus = (typeof summaryStatuses)[number];

export const outboundCallApprovalStatuses = [
  "pending",
  "approved",
  "denied",
  "not_required_for_mock"
] as const;

export type OutboundCallApprovalStatus =
  (typeof outboundCallApprovalStatuses)[number];

export const outboundCallRequestStatuses = [
  "draft",
  "pending_approval",
  "approved",
  "blocked",
  "ready_for_provider",
  "cancelled",
  "completed"
] as const;

export type OutboundCallRequestStatus =
  (typeof outboundCallRequestStatuses)[number];


export const telephonyDomainCallStates = [
  "requested",
  "queued",
  "dialing",
  "ringing",
  "answered",
  "in_conversation",
  "transferred",
  "held",
  "resumed",
  "completed",
  "failed",
  "busy",
  "no_answer",
  "voicemail",
  "cancelled"
] as const;

export type TelephonyDomainCallState =
  (typeof telephonyDomainCallStates)[number];

export const telephonyCallbackStates = [
  "requested",
  "scheduled",
  "assigned",
  "attempting",
  "completed",
  "failed",
  "cancelled"
] as const;

export type TelephonyCallbackState = (typeof telephonyCallbackStates)[number];

export const telephonyAppointmentStates = [
  "requested",
  "pending",
  "confirmed",
  "cancelled",
  "completed"
] as const;

export type TelephonyAppointmentState =
  (typeof telephonyAppointmentStates)[number];

export const telephonyVoicemailStates = [
  "received",
  "stored",
  "processed",
  "archived"
] as const;

export type TelephonyVoicemailState = (typeof telephonyVoicemailStates)[number];

export const telephonyPhoneNumberStatuses = [
  "reserved",
  "active",
  "suspended",
  "released"
] as const;

export type TelephonyPhoneNumberStatus =
  (typeof telephonyPhoneNumberStatuses)[number];

export const telephonyRoutingRuleTypes = [
  "business_hours",
  "after_hours",
  "holiday",
  "executive_unavailable",
  "language",
  "overflow",
  "emergency",
  "callback_required",
  "priority",
  "escalation"
] as const;

export type TelephonyRoutingRuleType =
  (typeof telephonyRoutingRuleTypes)[number];

export const telephonyUsageCategories = [
  "provider_minutes",
  "future_ai_runtime",
  "future_transcription",
  "future_tts",
  "future_stt",
  "recording_storage",
  "callback_attempt",
  "appointment_request"
] as const;

export type TelephonyUsageCategory = (typeof telephonyUsageCategories)[number];

export type TelephonyParty = {
  readonly displayName?: string;
  readonly phoneNumber?: string;
  readonly email?: string;
  readonly company?: string;
  readonly language?: string;
};

export type PhoneNumber = {
  readonly phoneNumberId: string;
  readonly tenantId: string;
  readonly e164Number: string;
  readonly extension?: string | null;
  readonly status: TelephonyPhoneNumberStatus;
  readonly capabilities: readonly ("inbound" | "outbound" | "sms" | "voice")[];
  readonly country: string;
  readonly timezone: string;
  readonly providerReference?: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CallSession = {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly phoneNumberId: string;
  readonly caller: TelephonyParty;
  readonly callee: TelephonyParty;
  readonly direction: TelephonyCallDirection;
  readonly state: TelephonyDomainCallState;
  readonly startTime?: string | null;
  readonly answerTime?: string | null;
  readonly endTime?: string | null;
  readonly durationSeconds?: number | null;
  readonly outcome?: string | null;
  readonly recordingReference?: string | null;
  readonly transcriptReference?: string | null;
  readonly metadata: Record<string, unknown>;
};

export type TelephonyCallbackRequest = {
  readonly callbackRequestId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId?: string | null;
  readonly requester: TelephonyParty;
  readonly requestedTime?: string | null;
  readonly priorityScore: number;
  readonly state: TelephonyCallbackState;
  readonly reason: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TelephonyAppointmentRequest = {
  readonly appointmentRequestId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId?: string | null;
  readonly requester: TelephonyParty;
  readonly requestedTime?: string | null;
  readonly timezone: string;
  readonly state: TelephonyAppointmentState;
  readonly purpose: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CallTranscript = {
  readonly transcriptId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId: string;
  readonly status: TranscriptStatus;
  readonly language?: string | null;
  readonly storageReference?: string | null;
  readonly retentionUntil?: string | null;
  readonly createdAt: string;
};

export type VoiceProfile = {
  readonly voiceProfileId: string;
  readonly tenantId: string;
  readonly language: string;
  readonly accent?: string | null;
  readonly tone: "executive" | "warm" | "calm" | "professional" | "urgent";
  readonly speed: "slow" | "standard" | "fast";
  readonly gender: "neutral" | "feminine" | "masculine" | "unspecified";
  readonly providerMapping?: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CallRecording = {
  readonly recordingId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId: string;
  readonly status: "disabled" | "pending" | "stored" | "archived" | "deleted";
  readonly storageReference?: string | null;
  readonly consentCaptured: boolean;
  readonly retentionUntil?: string | null;
  readonly createdAt: string;
};

export type Voicemail = {
  readonly voicemailId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId?: string | null;
  readonly state: TelephonyVoicemailState;
  readonly caller: TelephonyParty;
  readonly recordingReference?: string | null;
  readonly transcriptReference?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CallQueue = {
  readonly queueId: string;
  readonly tenantId: string;
  readonly cardId?: string | null;
  readonly name: string;
  readonly status: "active" | "paused" | "archived";
  readonly maxDepth: number;
  readonly priority: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TelephonyCallRoutingRule = {
  readonly ruleId: string;
  readonly tenantId: string;
  readonly cardId?: string | null;
  readonly ruleType: TelephonyRoutingRuleType;
  readonly priority: number;
  readonly condition: Record<string, unknown>;
  readonly action: "route_to_queue" | "queue_callback" | "take_message" | "escalate" | "block";
  readonly destination?: string | null;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type EscalationPolicy = {
  readonly policyId: string;
  readonly tenantId: string;
  readonly cardId?: string | null;
  readonly name: string;
  readonly hierarchy: readonly string[];
  readonly emergencyBehavior: "block" | "escalate_human" | "take_message";
  readonly requireHumanApproval: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TelephonyUsageLedgerEntry = {
  readonly ledgerEntryId: string;
  readonly tenantId: string;
  readonly cardId?: string | null;
  readonly sessionId?: string | null;
  readonly category: TelephonyUsageCategory;
  readonly quantity: number;
  readonly unit: "second" | "minute" | "request" | "byte" | "usd";
  readonly estimatedCostCents: number;
  readonly occurredAt: string;
  readonly metadata: Record<string, unknown>;
};

export type TelephonyAuditEvent = {
  readonly eventId: string;
  readonly eventType: string;
  readonly tenantId: string;
  readonly cardId?: string | null;
  readonly sessionId?: string | null;
  readonly actor: {
    readonly actorId: string;
    readonly actorType: "system" | "user" | "receptionist" | "provider";
    readonly displayName: string;
  };
  readonly occurredAt: string;
  readonly severity: "info" | "warning" | "critical";
  readonly metadata: Record<string, unknown>;
};

export type TelephonyControlPlaneResult = {
  readonly accepted: boolean;
  readonly status: "queued" | "blocked" | "requires_human_review";
  readonly reasonCodes: readonly string[];
  readonly auditEvents: readonly TelephonyAuditEvent[];
  readonly usageEntries: readonly TelephonyUsageLedgerEntry[];
};
export type TelephonyRuntimeConfig = {
  readonly provider: TelephonyProviderName;
  readonly voiceAgentEnabled: boolean;
  readonly outboundCallsEnabled: boolean;
  readonly requireHumanApproval: boolean;
  readonly twilioAccountSid?: string | null;
  readonly twilioAuthToken?: string | null;
  readonly twilioPhoneNumber?: string | null;
  readonly twilioWebhookSigningEnabled?: boolean;
  readonly openAiApiKey?: string | null;
  readonly openAiRealtimeModel?: string | null;
  readonly voiceRuntimeProvider?: "none" | "openai_realtime";
  readonly voiceTestMode?: boolean;
  readonly liveInboundCallsEnabled?: boolean;
  readonly allowProductionCalls?: boolean;
};

export type TelephonyProviderValidation = {
  readonly valid: boolean;
  readonly provider: TelephonyProviderName;
  readonly reasonCodes: readonly string[];
};

export type NormalizedInboundCall = {
  readonly provider: TelephonyProviderName;
  readonly providerCallId: string;
  readonly direction: "inbound";
  readonly fromNumber: string;
  readonly toNumber: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly language: string | null;
  readonly dialect: string | null;
  readonly status: "received";
};

export type MockInboundWebhookPayload = {
  readonly provider: "mock";
  readonly providerCallId: string;
  readonly fromNumber: string;
  readonly toNumber: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly language?: string | null;
  readonly dialect?: string | null;
};

export type OutboundCallRequestInput = {
  readonly requestedBy: string;
  readonly toNumber: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly reason: string;
  readonly approvedBy?: string | null;
};

export type PreparedOutboundCallRequest = {
  readonly requestedBy: string;
  readonly toNumber: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly reason: string;
  readonly approvalStatus: OutboundCallApprovalStatus;
  readonly status: OutboundCallRequestStatus;
  readonly safetyReasons: readonly string[];
};

export type VoiceSessionDraft = {
  readonly callId: string;
  readonly provider: TelephonyProviderName;
  readonly voiceModel: string;
  readonly status: VoiceSessionStatus;
  readonly language: string | null;
  readonly dialect: string | null;
  readonly transcriptStatus: TranscriptStatus;
  readonly summaryStatus: SummaryStatus;
};

export type TelephonySafetyGateResult = {
  readonly allowed: boolean;
  readonly status: OutboundCallRequestStatus;
  readonly approvalStatus: OutboundCallApprovalStatus;
  readonly reasonCodes: readonly string[];
};

export function isTelephonyProviderName(
  value: string
): value is TelephonyProviderName {
  return (telephonyProviders as readonly string[]).includes(value);
}

export function isTelephonyCallStatus(
  value: string
): value is TelephonyCallStatus {
  return (telephonyCallStatuses as readonly string[]).includes(value);
}

export function isTelephonyCallDirection(
  value: string
): value is TelephonyCallDirection {
  return (telephonyCallDirections as readonly string[]).includes(value);
}

export function isTelephonyCallEventType(
  value: string
): value is TelephonyCallEventType {
  return (telephonyCallEventTypes as readonly string[]).includes(value);
}

export function isVoiceSessionStatus(
  value: string
): value is VoiceSessionStatus {
  return (voiceSessionStatuses as readonly string[]).includes(value);
}

export function isOutboundCallApprovalStatus(
  value: string
): value is OutboundCallApprovalStatus {
  return (outboundCallApprovalStatuses as readonly string[]).includes(value);
}

export function isOutboundCallRequestStatus(
  value: string
): value is OutboundCallRequestStatus {
  return (outboundCallRequestStatuses as readonly string[]).includes(value);
}
