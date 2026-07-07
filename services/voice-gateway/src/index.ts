import { resolveVoiceProviderStatus } from "@bidayax/polyglot-receptionist";

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

export function resolveVoiceGatewayStatus(env: VoiceGatewayProviderEnvironment) {
  return resolveVoiceProviderStatus({
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
