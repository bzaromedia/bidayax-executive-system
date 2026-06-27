export const liveProviderNames = ["mock", "twilio", "openai_realtime"] as const;

export type LiveProviderName = (typeof liveProviderNames)[number];

export const providerReadinessStatuses = [
  "passed",
  "failed",
  "warning",
  "skipped"
] as const;

export type ProviderReadinessStatus =
  (typeof providerReadinessStatuses)[number];

export const voiceRuntimeSessionStatuses = [
  "not_configured",
  "configured",
  "prepared",
  "active_test",
  "completed_test",
  "blocked",
  "failed"
] as const;

export type VoiceRuntimeSessionStatus =
  (typeof voiceRuntimeSessionStatuses)[number];

export const voiceSafetyGateStatuses = [
  "blocked_by_default",
  "missing_configuration",
  "test_mode_only",
  "approved_for_test",
  "approved_for_production"
] as const;

export type VoiceSafetyGateStatus =
  (typeof voiceSafetyGateStatuses)[number];

export const liveVoiceSafetyReasonCodes = [
  "PROVIDER_NOT_TWILIO",
  "TWILIO_CONFIG_MISSING",
  "OPENAI_CONFIG_MISSING",
  "VOICE_AGENT_DISABLED",
  "TEST_MODE_ENABLED",
  "LIVE_INBOUND_DISABLED",
  "PRODUCTION_CALLS_DISABLED",
  "OUTBOUND_CALLS_DISABLED",
  "HUMAN_APPROVAL_REQUIRED",
  "OUTBOUND_REQUEST_NOT_APPROVED",
  "WEBHOOK_SIGNATURE_REQUIRED",
  "WEBHOOK_SIGNATURE_INVALID",
  "MALFORMED_PROVIDER_PAYLOAD"
] as const;

export type LiveVoiceSafetyReasonCode =
  (typeof liveVoiceSafetyReasonCodes)[number];

export type ProviderReadinessCheck = {
  readonly provider: LiveProviderName;
  readonly checkName: string;
  readonly status: ProviderReadinessStatus;
  readonly details: string;
  readonly checkedAt: string;
};

export type LiveProviderRuntimeConfig = {
  readonly telephonyProvider: "mock" | "twilio";
  readonly twilioAccountSid: string | null;
  readonly twilioAuthToken: string | null;
  readonly twilioPhoneNumber: string | null;
  readonly twilioWebhookSigningEnabled: boolean;
  readonly openAiApiKey: string | null;
  readonly openAiRealtimeModel: string | null;
  readonly voiceAgentEnabled: boolean;
  readonly voiceRuntimeProvider: "none" | "openai_realtime";
  readonly voiceTestMode: boolean;
  readonly liveInboundCallsEnabled: boolean;
  readonly outboundCallsEnabled: boolean;
  readonly requireHumanApproval: boolean;
  readonly allowProductionCalls: boolean;
};

export type TwilioInboundWebhookPayload = {
  readonly AccountSid: string;
  readonly CallSid: string;
  readonly From: string;
  readonly To: string;
  readonly CallStatus?: string;
  readonly Direction?: string;
  readonly SpeechResult?: string;
  readonly Digits?: string;
  readonly executiveSlug?: string;
};

export type TwilioWebhookValidationInput = {
  readonly url: string;
  readonly headers: Readonly<Record<string, string | null>>;
  readonly rawBody: string;
  readonly params: Readonly<Record<string, string>>;
  readonly authToken: string | null;
  readonly signingEnabled: boolean;
  readonly productionMode: boolean;
};

export type TwilioWebhookValidationResult = {
  readonly valid: boolean;
  readonly reasonCodes: readonly LiveVoiceSafetyReasonCode[];
  readonly signingChecked: boolean;
};

export type LiveVoiceSafetyGateResult = {
  readonly allowed: boolean;
  readonly safetyGateStatus: VoiceSafetyGateStatus;
  readonly reasonCodes: readonly LiveVoiceSafetyReasonCode[];
};

export type VoiceRuntimeReadinessResult = {
  readonly provider: "openai_realtime" | "none";
  readonly runtimeModel: string | null;
  readonly status: VoiceRuntimeSessionStatus;
  readonly testMode: boolean;
  readonly safetyGateStatus: VoiceSafetyGateStatus;
  readonly transcriptStatus: "none" | "pending" | "partial" | "completed" | "failed";
  readonly summaryStatus: "none" | "pending" | "completed" | "failed";
  readonly reasonCodes: readonly LiveVoiceSafetyReasonCode[];
};

export function isProviderReadinessStatus(
  value: string
): value is ProviderReadinessStatus {
  return (providerReadinessStatuses as readonly string[]).includes(value);
}

export function isVoiceRuntimeSessionStatus(
  value: string
): value is VoiceRuntimeSessionStatus {
  return (voiceRuntimeSessionStatuses as readonly string[]).includes(value);
}

export function isVoiceSafetyGateStatus(
  value: string
): value is VoiceSafetyGateStatus {
  return (voiceSafetyGateStatuses as readonly string[]).includes(value);
}

