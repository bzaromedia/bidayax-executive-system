import type { ReceptionistProviderStatusValue } from "@bidayax/types";

export type VoiceProviderDispatchResult = {
  readonly status: ReceptionistProviderStatusValue;
  readonly providerReferenceId: string | null;
  readonly safeMessage: string;
};

export type VoiceTelephonyProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly answerInboundCall: (input: {
    readonly providerCallId: string;
    readonly greeting: string;
  }) => Promise<VoiceProviderDispatchResult>;
  readonly transferCall: (input: {
    readonly providerCallId: string;
    readonly destination: string;
  }) => Promise<VoiceProviderDispatchResult>;
};

export type SpeechToTextProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly transcribe: (input: {
    readonly audioReference: string;
    readonly languageHint: string | null;
  }) => Promise<{
    readonly transcript: string;
    readonly language: string | null;
    readonly confidence: number;
  }>;
};

export type RealtimeVoiceAgentProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly createSession: (input: {
    readonly systemSafetySummary: string;
    readonly language: string;
  }) => Promise<VoiceProviderDispatchResult>;
};

export type TextToSpeechProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly synthesize: (input: {
    readonly text: string;
    readonly language: string;
    readonly voiceStyle: string;
  }) => Promise<VoiceProviderDispatchResult>;
};

export type TranslationProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly translateToEnglish: (input: {
    readonly text: string;
    readonly sourceLanguage: string;
  }) => Promise<{
    readonly translatedText: string;
    readonly confidence: number;
  }>;
};

export function resolveVoiceProviderStatus(input: {
  readonly telephonyConfigured: boolean;
  readonly speechToTextConfigured: boolean;
  readonly realtimeAgentConfigured: boolean;
  readonly textToSpeechConfigured: boolean;
  readonly translationConfigured: boolean;
}) {
  const configured = Object.values(input).filter(Boolean).length;

  return {
    configuredCount: configured,
    status: configured === 5 ? "configured" : "provider_unconfigured" as const,
    telephony: input.telephonyConfigured ? "configured" : "provider_unconfigured",
    speechToText: input.speechToTextConfigured ? "configured" : "provider_unconfigured",
    realtimeAgent: input.realtimeAgentConfigured ? "configured" : "provider_unconfigured",
    textToSpeech: input.textToSpeechConfigured ? "configured" : "provider_unconfigured",
    translation: input.translationConfigured ? "configured" : "provider_unconfigured"
  };
}

export type TelephonyProvider = VoiceTelephonyProvider;

export type RealtimeVoiceProvider = RealtimeVoiceAgentProvider;

export type CalendarProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly createAppointmentRequest: (input: {
    readonly executiveSlug: string;
    readonly requesterEmail: string;
    readonly requestedTime: string | null;
    readonly summary: string;
  }) => Promise<VoiceProviderDispatchResult>;
};

export type NotificationProvider = {
  readonly providerName: string;
  readonly configured: boolean;
  readonly notifyExecutive: (input: {
    readonly executiveSlug: string;
    readonly to: string;
    readonly subject: string;
    readonly body: string;
  }) => Promise<VoiceProviderDispatchResult>;
};