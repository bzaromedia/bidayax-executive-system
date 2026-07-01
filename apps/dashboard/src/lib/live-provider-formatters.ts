import type {
  LiveVoiceSafetyReasonCode,
  ProviderReadinessStatus,
  VoiceSafetyGateStatus,
  VoiceRuntimeSessionStatus
} from "@bidayax/types";

export const providerReadinessStatusLabels = {
  failed: "Failed",
  passed: "Passed",
  skipped: "Skipped",
  warning: "Warning"
} as const satisfies Record<ProviderReadinessStatus, string>;

export const voiceRuntimeStatusLabels = {
  active_test: "Active test",
  blocked: "Blocked",
  completed_test: "Completed test",
  configured: "Configured",
  failed: "Failed",
  not_configured: "Not configured",
  prepared: "Prepared"
} as const satisfies Record<VoiceRuntimeSessionStatus, string>;

export const voiceSafetyGateStatusLabels = {
  approved_for_production: "Approved for production",
  approved_for_test: "Approved for test",
  blocked_by_default: "Blocked by default",
  missing_configuration: "Missing configuration",
  test_mode_only: "Test mode only"
} as const satisfies Record<VoiceSafetyGateStatus, string>;

export const liveVoiceReasonLabels = {
  HUMAN_APPROVAL_REQUIRED: "Human approval required",
  LIVE_INBOUND_DISABLED: "Live inbound disabled",
  MALFORMED_PROVIDER_PAYLOAD: "Malformed provider payload",
  OPENAI_CONFIG_MISSING: "OpenAI Realtime configuration missing",
  OUTBOUND_CALLS_DISABLED: "Outbound calls disabled",
  OUTBOUND_REQUEST_NOT_APPROVED: "Outbound request not approved",
  PRODUCTION_CALLS_DISABLED: "Production calls disabled",
  PROVIDER_NOT_TWILIO: "Provider is not Twilio",
  TEST_MODE_ENABLED: "Test mode enabled",
  TWILIO_CONFIG_MISSING: "Twilio configuration missing",
  VOICE_AGENT_DISABLED: "Voice agent disabled",
  WEBHOOK_SIGNATURE_INVALID: "Webhook signature invalid",
  WEBHOOK_SIGNATURE_REQUIRED: "Webhook signature required"
} as const satisfies Record<LiveVoiceSafetyReasonCode, string>;

export function formatProviderMode(providerMode: "mock" | "twilio") {
  return providerMode === "twilio"
    ? "Twilio integration"
    : "Safety-gated future integration";
}
