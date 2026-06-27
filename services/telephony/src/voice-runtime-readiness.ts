import type {
  LiveProviderRuntimeConfig,
  VoiceRuntimeReadinessResult
} from "@bidayax/types";
import { evaluateProductionVoiceSafety } from "./live-voice-safety-gates";

export function prepareVoiceRuntimeReadiness(
  config: LiveProviderRuntimeConfig
): VoiceRuntimeReadinessResult {
  const safety = evaluateProductionVoiceSafety(config);
  const hasRuntimeConfig = Boolean(
    config.voiceRuntimeProvider === "openai_realtime" &&
      config.openAiApiKey &&
      config.openAiRealtimeModel
  );

  return {
    provider: config.voiceRuntimeProvider,
    reasonCodes: safety.reasonCodes,
    runtimeModel: config.openAiRealtimeModel,
    safetyGateStatus: safety.safetyGateStatus,
    status: hasRuntimeConfig
      ? config.voiceTestMode
        ? "prepared"
        : safety.allowed
          ? "configured"
          : "blocked"
      : "not_configured",
    summaryStatus: "none",
    testMode: config.voiceTestMode,
    transcriptStatus: "none"
  };
}

