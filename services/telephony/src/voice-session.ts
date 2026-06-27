import type {
  TelephonyProviderName,
  VoiceSessionDraft
} from "@bidayax/types";

export function prepareVoiceSession({
  callId,
  dialect,
  language,
  provider,
  voiceModel = "future-voice-runtime"
}: {
  readonly callId: string;
  readonly dialect?: string | null;
  readonly language?: string | null;
  readonly provider: TelephonyProviderName;
  readonly voiceModel?: string;
}): VoiceSessionDraft {
  return {
    callId,
    dialect: dialect ?? null,
    language: language ?? null,
    provider,
    status: "prepared",
    summaryStatus: "none",
    transcriptStatus: "none",
    voiceModel
  };
}
