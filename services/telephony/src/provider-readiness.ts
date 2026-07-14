import type {
  LiveProviderRuntimeConfig,
  ProviderReadinessCheck
} from "@bidayax/types";
import { isTelephonyProviderExecutionMode, isTelephonyProviderName } from "@bidayax/types";

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function readVoiceRuntimeProvider(value: string | undefined) {
  return value === "openai_realtime" ? "openai_realtime" : "none";
}

function readProviderExecutionMode(value: string | undefined) {
  return value !== undefined && isTelephonyProviderExecutionMode(value)
    ? value
    : "disabled";
}

export function getLiveProviderRuntimeConfig(
  env: Record<string, string | undefined> = process.env
): LiveProviderRuntimeConfig {
  const providerCandidate = env.TELEPHONY_PROVIDER ?? "mock";
  const telephonyProvider =
    isTelephonyProviderName(providerCandidate) && providerCandidate === "twilio"
      ? "twilio"
      : "mock";

  return {
    allowProductionCalls: readBoolean(env.ALLOW_PRODUCTION_CALLS, false),
    liveInboundCallsEnabled: readBoolean(env.LIVE_INBOUND_CALLS_ENABLED, false),
    sandboxProviderEnabled: readProviderExecutionMode(env.TELEPHONY_PROVIDER_MODE) === "sandbox",
    sandboxWebhookSigningSecretConfigured: Boolean(env.TELEPHONY_SANDBOX_WEBHOOK_SECRET),
    openAiApiKey: env.OPENAI_API_KEY ?? null,
    openAiRealtimeModel: env.OPENAI_REALTIME_MODEL ?? null,
    outboundCallsEnabled: readBoolean(env.OUTBOUND_CALLS_ENABLED, false),
    requireHumanApproval: readBoolean(env.REQUIRE_HUMAN_APPROVAL ?? env.HUMAN_APPROVAL_REQUIRED, true),
    telephonyProvider,
    telephonyProviderExecutionMode: readProviderExecutionMode(env.TELEPHONY_PROVIDER_MODE),
    twilioAccountSid: env.TWILIO_ACCOUNT_SID ?? null,
    twilioAuthToken: env.TWILIO_AUTH_TOKEN ?? null,
    twilioPhoneNumber: env.TWILIO_PHONE_NUMBER ?? null,
    twilioWebhookSigningEnabled: readBoolean(
      env.TWILIO_WEBHOOK_SIGNING_ENABLED,
      false
    ),
    voiceAgentEnabled: readBoolean(env.VOICE_AGENT_ENABLED, false),
    voiceRuntimeProvider: readVoiceRuntimeProvider(env.VOICE_RUNTIME_PROVIDER),
    voiceTestMode: readBoolean(env.VOICE_TEST_MODE, true)
  };
}

function createCheck({
  checkName,
  details,
  provider,
  status
}: Omit<ProviderReadinessCheck, "checkedAt">): ProviderReadinessCheck {
  return {
    checkedAt: new Date().toISOString(),
    checkName,
    details,
    provider,
    status
  };
}

export function validateTwilioReadiness(
  config: LiveProviderRuntimeConfig
): readonly ProviderReadinessCheck[] {
  const requiredConfigPresent = Boolean(
    config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber
  );

  return [
    createCheck({
      checkName: "telephony_provider",
      details:
        config.telephonyProvider === "twilio"
          ? "Twilio is selected as the telephony provider."
          : "Telephony provider defaults to mock until Twilio is explicitly selected.",
      provider: "twilio",
      status: config.telephonyProvider === "twilio" ? "passed" : "skipped"
    }),
    createCheck({
      checkName: "twilio_required_configuration",
      details: requiredConfigPresent
        ? "Twilio account SID, auth token, and phone number are present."
        : "Twilio configuration is incomplete. No secret values are exposed.",
      provider: "twilio",
      status: requiredConfigPresent ? "passed" : "failed"
    }),
    createCheck({
      checkName: "twilio_webhook_signature_policy",
      details: config.twilioWebhookSigningEnabled
        ? "Webhook signature validation is required."
        : "Webhook signature validation is disabled for local/test mode.",
      provider: "twilio",
      status: config.twilioWebhookSigningEnabled ? "passed" : "warning"
    }),
    createCheck({
      checkName: "live_inbound_gate",
      details: config.liveInboundCallsEnabled
        ? "Live inbound calls are enabled by environment flag."
        : "Live inbound calls are disabled by default.",
      provider: "twilio",
      status: config.liveInboundCallsEnabled ? "passed" : "warning"
    })
  ];
}

export function validateOpenAiRealtimeReadiness(
  config: LiveProviderRuntimeConfig
): readonly ProviderReadinessCheck[] {
  const configPresent = Boolean(config.openAiApiKey && config.openAiRealtimeModel);

  return [
    createCheck({
      checkName: "voice_runtime_provider",
      details:
        config.voiceRuntimeProvider === "openai_realtime"
          ? "OpenAI Realtime is selected as the voice runtime provider."
          : "Voice runtime provider is none by default.",
      provider: "openai_realtime",
      status:
        config.voiceRuntimeProvider === "openai_realtime" ? "passed" : "skipped"
    }),
    createCheck({
      checkName: "openai_realtime_configuration",
      details: configPresent
        ? "OpenAI API key and Realtime model are present."
        : "OpenAI Realtime configuration is incomplete. No secret values are exposed.",
      provider: "openai_realtime",
      status: configPresent ? "passed" : "failed"
    }),
    createCheck({
      checkName: "voice_agent_gate",
      details: config.voiceAgentEnabled
        ? "Voice agent flag is enabled."
        : "Voice agent is disabled by default.",
      provider: "openai_realtime",
      status: config.voiceAgentEnabled ? "passed" : "warning"
    }),
    createCheck({
      checkName: "voice_test_mode",
      details: config.voiceTestMode
        ? "Voice runtime remains in test-call mode."
        : "Voice test mode is disabled by environment flag.",
      provider: "openai_realtime",
      status: config.voiceTestMode ? "warning" : "passed"
    })
  ];
}

export function validateSandboxProviderReadiness(
  config: LiveProviderRuntimeConfig
): readonly ProviderReadinessCheck[] {
  return [
    createCheck({
      checkName: "sandbox_provider_mode",
      details:
        config.telephonyProviderExecutionMode === "sandbox"
          ? "Sandbox provider adapter mode is enabled for deterministic local/test calls only."
          : "Sandbox provider adapter mode is disabled by default.",
      provider: "mock",
      status: config.telephonyProviderExecutionMode === "sandbox" ? "passed" : "skipped"
    }),
    createCheck({
      checkName: "sandbox_webhook_signature_policy",
      details: config.sandboxWebhookSigningSecretConfigured
        ? "Sandbox webhook signature verification has a test-only secret configured."
        : "Sandbox webhook signature verification requires TELEPHONY_SANDBOX_WEBHOOK_SECRET for sandbox webhook tests.",
      provider: "mock",
      status: config.sandboxWebhookSigningSecretConfigured ? "passed" : "warning"
    }),
    createCheck({
      checkName: "production_provider_mode_gate",
      details:
        config.telephonyProviderExecutionMode === "production"
          ? "Production provider mode is not permitted before a future controlled activation phase."
          : "Production provider mode is not active.",
      provider: "mock",
      status: config.telephonyProviderExecutionMode === "production" ? "failed" : "passed"
    })
  ];
}

export function getProviderReadinessChecks(
  config: LiveProviderRuntimeConfig
): readonly ProviderReadinessCheck[] {
  return [
    ...validateSandboxProviderReadiness(config),
    createCheck({
      checkName: "mock_provider_default",
      details:
        config.telephonyProvider === "mock"
          ? "Mock mode is active by default."
          : "Mock mode is not active because another provider is selected.",
      provider: "mock",
      status: config.telephonyProvider === "mock" ? "passed" : "skipped"
    }),
    ...validateTwilioReadiness(config),
    ...validateOpenAiRealtimeReadiness(config)
  ];
}

