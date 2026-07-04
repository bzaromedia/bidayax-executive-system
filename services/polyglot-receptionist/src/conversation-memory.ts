import type { CallIntent, CallSummary, SupportedReceptionistLanguage } from "@bidayax/types";
import { sanitizeReceptionistText } from "./prompt-injection-guard";

export type MultilingualConversationMemory = {
  readonly originalTranscript: string;
  readonly detectedLanguage: SupportedReceptionistLanguage | "Unknown";
  readonly translatedTranscript: string | null;
  readonly summary: string;
  readonly actionItems: readonly string[];
  readonly callerIntent: CallIntent;
  readonly confidenceScore: number;
};

export function createMultilingualConversationMemory(input: {
  readonly transcript: string;
  readonly detectedLanguage: SupportedReceptionistLanguage | "Unknown";
  readonly intent: CallIntent;
  readonly confidenceScore: number;
  readonly actionTaken: string;
}): MultilingualConversationMemory {
  const originalTranscript = sanitizeReceptionistText(input.transcript);
  const translatedTranscript = input.detectedLanguage === "English"
    ? null
    : `[English summary prepared from ${input.detectedLanguage} transcript] ${originalTranscript}`;
  const summary = `Caller intent: ${input.intent}. Recommended action: ${input.actionTaken}.`;

  return {
    actionItems: [`Review ${input.actionTaken} workflow`, "Confirm human approval before sensitive follow-up"],
    callerIntent: input.intent,
    confidenceScore: input.confidenceScore,
    detectedLanguage: input.detectedLanguage,
    originalTranscript,
    summary,
    translatedTranscript
  };
}

export function toCallSummary(memory: MultilingualConversationMemory): CallSummary {
  return {
    actionItems: memory.actionItems,
    callerIntent: memory.callerIntent,
    confidenceScore: memory.confidenceScore,
    englishSummary: memory.translatedTranscript ?? memory.summary,
    originalTranscript: memory.originalTranscript
  };
}
