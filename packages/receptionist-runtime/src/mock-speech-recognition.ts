import type { SpeechRecognitionProvider } from "./types";

export function createMockSpeechRecognitionProvider(): SpeechRecognitionProvider {
  return {
    providerName: "mock-stt",
    transcribe: async ({ languageHint = "English", text }) => ({
      confidence: text?.trim() ? 0.98 : 0.3,
      language: languageHint,
      providerStatus: "mock_only",
      transcript: text?.trim() || "I need help reaching the executive team."
    })
  };
}