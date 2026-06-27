import { readBooleanFlag, readStringFlag } from "./runtime-flags";

export type RuntimeEnvironment = "development" | "test" | "production";

export type EnvironmentConfig = {
  readonly nodeEnv: RuntimeEnvironment;
  readonly databaseUrl: string | null;
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
  readonly appBaseUrl: string | null;
  readonly dashboardBaseUrl: string | null;
  readonly cardBaseUrl: string | null;
};

export type EnvironmentValidationResult = {
  readonly config: EnvironmentConfig;
  readonly status: "passed" | "warning" | "failed";
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

function readNodeEnv(value: string | undefined): RuntimeEnvironment {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

function readTelephonyProvider(value: string | undefined) {
  return value === "twilio" ? "twilio" : "mock";
}

function readVoiceRuntimeProvider(value: string | undefined) {
  return value === "openai_realtime" ? "openai_realtime" : "none";
}

export function readEnvironmentConfig(
  env: Record<string, string | undefined> = process.env
): EnvironmentConfig {
  return {
    allowProductionCalls: readBooleanFlag(env.ALLOW_PRODUCTION_CALLS, false),
    appBaseUrl: readStringFlag(env.APP_BASE_URL),
    cardBaseUrl: readStringFlag(env.CARD_BASE_URL),
    dashboardBaseUrl: readStringFlag(env.DASHBOARD_BASE_URL),
    databaseUrl: readStringFlag(env.DATABASE_URL),
    liveInboundCallsEnabled: readBooleanFlag(env.LIVE_INBOUND_CALLS_ENABLED, false),
    nodeEnv: readNodeEnv(env.NODE_ENV),
    openAiApiKey: readStringFlag(env.OPENAI_API_KEY),
    openAiRealtimeModel: readStringFlag(env.OPENAI_REALTIME_MODEL),
    outboundCallsEnabled: readBooleanFlag(env.OUTBOUND_CALLS_ENABLED, false),
    requireHumanApproval: readBooleanFlag(env.REQUIRE_HUMAN_APPROVAL, true),
    telephonyProvider: readTelephonyProvider(env.TELEPHONY_PROVIDER),
    twilioAccountSid: readStringFlag(env.TWILIO_ACCOUNT_SID),
    twilioAuthToken: readStringFlag(env.TWILIO_AUTH_TOKEN),
    twilioPhoneNumber: readStringFlag(env.TWILIO_PHONE_NUMBER),
    twilioWebhookSigningEnabled: readBooleanFlag(
      env.TWILIO_WEBHOOK_SIGNING_ENABLED,
      false
    ),
    voiceAgentEnabled: readBooleanFlag(env.VOICE_AGENT_ENABLED, false),
    voiceRuntimeProvider: readVoiceRuntimeProvider(env.VOICE_RUNTIME_PROVIDER),
    voiceTestMode: readBooleanFlag(env.VOICE_TEST_MODE, true)
  };
}

export function validateEnvironmentConfig(
  env: Record<string, string | undefined> = process.env
): EnvironmentValidationResult {
  const config = readEnvironmentConfig(env);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.nodeEnv === "production") {
    if (!config.databaseUrl) {
      errors.push("DATABASE_URL is required in production.");
    }

    if (!config.appBaseUrl || !config.dashboardBaseUrl || !config.cardBaseUrl) {
      errors.push("APP_BASE_URL, DASHBOARD_BASE_URL, and CARD_BASE_URL are required in production.");
    }

    if (!config.twilioWebhookSigningEnabled && config.telephonyProvider === "twilio") {
      errors.push("TWILIO_WEBHOOK_SIGNING_ENABLED must be true for production Twilio webhooks.");
    }
  } else if (!config.databaseUrl) {
    warnings.push("DATABASE_URL is not configured. Database-backed readiness will be degraded.");
  }

  if (config.telephonyProvider === "twilio") {
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      errors.push("Twilio provider selected but required Twilio values are missing.");
    }
  }

  if (config.voiceRuntimeProvider === "openai_realtime") {
    if (!config.openAiApiKey || !config.openAiRealtimeModel) {
      errors.push("OpenAI Realtime selected but OPENAI_API_KEY or OPENAI_REALTIME_MODEL is missing.");
    }
  }

  if (config.allowProductionCalls && config.voiceTestMode) {
    errors.push("ALLOW_PRODUCTION_CALLS cannot be true while VOICE_TEST_MODE is true.");
  }

  if (config.allowProductionCalls && !config.voiceAgentEnabled) {
    errors.push("ALLOW_PRODUCTION_CALLS requires VOICE_AGENT_ENABLED=true.");
  }

  if (config.outboundCallsEnabled && config.requireHumanApproval === false) {
    errors.push("Outbound calls require human approval in this hardening phase.");
  }

  if (config.telephonyProvider === "mock") {
    warnings.push("Telephony provider is mock. Live provider integration remains inactive.");
  }

  if (!config.allowProductionCalls) {
    warnings.push("Production calls are disabled by default.");
  }

  return {
    config,
    errors,
    status: errors.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    warnings
  };
}
