import { createHash } from "node:crypto";
import type { SpeechSynthesisProvider } from "./types";

export function createMockSpeechSynthesisProvider(): SpeechSynthesisProvider {
  return {
    providerName: "mock-tts",
    synthesize: async ({ language, text }) => {
      const digest = createHash("sha256").update(`${language}:${text}`).digest("hex").slice(0, 16);

      return {
        audioReference: `mock-audio://${digest}`,
        durationMs: Math.max(600, Math.min(8000, text.length * 45)),
        providerStatus: "mock_only"
      };
    }
  };
}