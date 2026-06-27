import type { LiveProviderRuntimeConfig } from "@bidayax/types";

export function getTestCallModeStatus(config: LiveProviderRuntimeConfig) {
  return {
    enabled: config.voiceTestMode,
    label: config.voiceTestMode
      ? "Test-call mode enabled"
      : "Test-call mode disabled",
    productionCallsAllowed:
      !config.voiceTestMode && config.allowProductionCalls === true
  };
}

