export type VoiceGatewayProviderEnvironment = {
  readonly twilioAccountSid?: string;
  readonly twilioAuthToken?: string;
  readonly twilioPhoneNumber?: string;
  readonly telnyxApiKey?: string;
  readonly openAiApiKey?: string;
  readonly deepgramApiKey?: string;
  readonly elevenLabsApiKey?: string;
};

export type VoiceChatSessionPlaceholder = {
  readonly sessionId: string;
  readonly status: "provider_unconfigured" | "configured";
  readonly safeMessage: string;
};

export type VoiceGatewayAvailabilityInput = {
  readonly telephonyConfigured: boolean;
  readonly speechToTextConfigured: boolean;
  readonly realtimeAgentConfigured: boolean;
  readonly textToSpeechConfigured: boolean;
  readonly translationConfigured: boolean;
};

function resolveVoiceGatewayProviderStatus(input: VoiceGatewayAvailabilityInput) {
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

export function resolveVoiceGatewayStatus(env: VoiceGatewayProviderEnvironment) {
  return resolveVoiceGatewayProviderStatus({
    realtimeAgentConfigured: Boolean(env.openAiApiKey || env.elevenLabsApiKey),
    speechToTextConfigured: Boolean(env.deepgramApiKey || env.openAiApiKey),
    telephonyConfigured: Boolean(
      (env.twilioAccountSid && env.twilioAuthToken && env.twilioPhoneNumber) || env.telnyxApiKey
    ),
    textToSpeechConfigured: Boolean(env.elevenLabsApiKey || env.openAiApiKey),
    translationConfigured: Boolean(env.openAiApiKey)
  });
}

export function createVoiceChatPlaceholderSession(input: {
  readonly executiveSlug: string;
  readonly visitorId: string;
  readonly env: VoiceGatewayProviderEnvironment;
}): VoiceChatSessionPlaceholder {
  const status = resolveVoiceGatewayStatus(input.env).status as VoiceChatSessionPlaceholder["status"];

  return {
    safeMessage:
      status === "configured"
        ? "Voice chat provider configuration is available for a guarded session."
        : "Voice chat transcript mode is queued pending realtime voice provider configuration.",
    sessionId: `voice-chat-${input.executiveSlug}-${input.visitorId}`,
    status
  };
}
