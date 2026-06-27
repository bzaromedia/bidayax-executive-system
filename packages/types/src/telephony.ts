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
