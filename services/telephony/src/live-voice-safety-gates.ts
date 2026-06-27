import type {
  LiveProviderRuntimeConfig,
  LiveVoiceSafetyGateResult,
  LiveVoiceSafetyReasonCode,
  OutboundCallApprovalStatus,
  OutboundCallRequestStatus
} from "@bidayax/types";
import { createTelemetrySafetyGateEvent } from "@bidayax/telemetry";

function sortReasonCodes(
  reasons: Iterable<LiveVoiceSafetyReasonCode>
): readonly LiveVoiceSafetyReasonCode[] {
  return Array.from(new Set(reasons)).sort();
}

export function evaluateProductionVoiceSafety(
  config: LiveProviderRuntimeConfig
): LiveVoiceSafetyGateResult {
  const reasons = new Set<LiveVoiceSafetyReasonCode>();

  if (config.telephonyProvider !== "twilio") {
    reasons.add("PROVIDER_NOT_TWILIO");
  }

  if (
    !config.twilioAccountSid ||
    !config.twilioAuthToken ||
    !config.twilioPhoneNumber
  ) {
    reasons.add("TWILIO_CONFIG_MISSING");
  }

  if (!config.openAiApiKey || !config.openAiRealtimeModel) {
    reasons.add("OPENAI_CONFIG_MISSING");
  }

  if (!config.voiceAgentEnabled) {
    reasons.add("VOICE_AGENT_DISABLED");
  }

  if (config.voiceTestMode) {
    reasons.add("TEST_MODE_ENABLED");
  }

  if (!config.liveInboundCallsEnabled) {
    reasons.add("LIVE_INBOUND_DISABLED");
  }

  if (!config.allowProductionCalls) {
    reasons.add("PRODUCTION_CALLS_DISABLED");
  }

  if (config.requireHumanApproval) {
    reasons.add("HUMAN_APPROVAL_REQUIRED");
  }

  const reasonCodes = sortReasonCodes(reasons);
  const allowed = reasonCodes.length === 0;
  const result = {
    allowed,
    reasonCodes,
    safetyGateStatus: allowed
      ? ("approved_for_production" as const)
      : config.voiceTestMode
        ? ("test_mode_only" as const)
        : ("missing_configuration" as const)
  };

  console.info(
    JSON.stringify({
      component: "telephony-safety-telemetry",
      safetyGate: createTelemetrySafetyGateEvent({
        decision: result.allowed ? "allowed" : "blocked",
        gateName: "production_voice",
        reasonCodes: result.reasonCodes,
        subsystem: "telephony"
      })
    })
  );

  return result;
}

export function evaluateOutboundLiveCallSafety({
  approvalStatus,
  config,
  requestStatus
}: {
  readonly approvalStatus: OutboundCallApprovalStatus;
  readonly config: LiveProviderRuntimeConfig;
  readonly requestStatus: OutboundCallRequestStatus;
}): LiveVoiceSafetyGateResult {
  const inboundSafety = evaluateProductionVoiceSafety(config);
  const reasons = new Set<LiveVoiceSafetyReasonCode>(inboundSafety.reasonCodes);

  if (!config.outboundCallsEnabled) {
    reasons.add("OUTBOUND_CALLS_DISABLED");
  }

  if (
    approvalStatus !== "approved" ||
    (requestStatus !== "approved" && requestStatus !== "ready_for_provider")
  ) {
    reasons.add("OUTBOUND_REQUEST_NOT_APPROVED");
  }

  const reasonCodes = sortReasonCodes(reasons);
  const allowed = reasonCodes.length === 0;
  const result = {
    allowed,
    reasonCodes,
    safetyGateStatus: allowed
      ? ("approved_for_production" as const)
      : ("blocked_by_default" as const)
  };

  console.info(
    JSON.stringify({
      component: "telephony-safety-telemetry",
      safetyGate: createTelemetrySafetyGateEvent({
        decision: result.allowed ? "allowed" : "blocked",
        gateName: "outbound_live_call",
        reasonCodes: result.reasonCodes,
        subsystem: "telephony"
      })
    })
  );

  return result;
}
