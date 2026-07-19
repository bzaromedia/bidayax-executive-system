export type VoiceChannelAvailabilityInput = {
  readonly telephonyConfigured: boolean;
  readonly speechToTextConfigured: boolean;
  readonly realtimeAgentConfigured: boolean;
  readonly textToSpeechConfigured: boolean;
  readonly translationConfigured: boolean;
};

export function resolveVoiceProviderStatus(
  input: VoiceChannelAvailabilityInput
) {
  const configured = Object.values(input).filter(Boolean).length;

  return {
    configuredCount: configured,
    status: configured === 5 ? "configured" : ("provider_unconfigured" as const),
    telephony: input.telephonyConfigured ? "configured" : "provider_unconfigured",
    speechToText: input.speechToTextConfigured ? "configured" : "provider_unconfigured",
    realtimeAgent: input.realtimeAgentConfigured ? "configured" : "provider_unconfigured",
    textToSpeech: input.textToSpeechConfigured ? "configured" : "provider_unconfigured",
    translation: input.translationConfigured ? "configured" : "provider_unconfigured"
  };
}