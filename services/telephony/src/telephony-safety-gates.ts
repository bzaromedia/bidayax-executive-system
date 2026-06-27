import {
  isTelephonyProviderName,
  type OutboundCallApprovalStatus,
  type TelephonyRuntimeConfig,
  type TelephonySafetyGateResult
} from "@bidayax/types";

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

export function getTelephonyRuntimeConfig(
  env: Record<string, string | undefined> = process.env
): TelephonyRuntimeConfig {
  const providerCandidate = env.TELEPHONY_PROVIDER ?? "mock";

  return {
    openAiApiKey: env.OPENAI_API_KEY ?? null,
    outboundCallsEnabled: readBoolean(env.OUTBOUND_CALLS_ENABLED, false),
    provider: isTelephonyProviderName(providerCandidate)
      ? providerCandidate
      : "mock",
    requireHumanApproval: readBoolean(env.REQUIRE_HUMAN_APPROVAL, true),
    twilioAccountSid: env.TWILIO_ACCOUNT_SID ?? null,
    twilioAuthToken: env.TWILIO_AUTH_TOKEN ?? null,
    twilioPhoneNumber: env.TWILIO_PHONE_NUMBER ?? null,
    voiceAgentEnabled: readBoolean(env.VOICE_AGENT_ENABLED, false)
  };
}

export function evaluateOutboundCallSafety({
  approvalStatus,
  config
}: {
  readonly approvalStatus: OutboundCallApprovalStatus;
  readonly config: TelephonyRuntimeConfig;
}): TelephonySafetyGateResult {
  const reasons = new Set<string>();

  if (!config.outboundCallsEnabled) {
    reasons.add("OUTBOUND_CALLS_DISABLED");
  }

  if (config.voiceAgentEnabled) {
    reasons.add("VOICE_AGENT_ENABLED_BUT_PHASE_9_BLOCKS_EXECUTION");
  }

  if (config.requireHumanApproval && approvalStatus !== "approved") {
    reasons.add("HUMAN_APPROVAL_REQUIRED");
  }

  if (config.provider !== "mock") {
    reasons.add("REAL_PROVIDER_EXECUTION_NOT_IMPLEMENTED");
  }

  const allowed = reasons.size === 0 && config.provider === "mock";

  return {
    allowed,
    approvalStatus,
    reasonCodes: Array.from(reasons).sort(),
    status: allowed ? "ready_for_provider" : "blocked"
  };
}
