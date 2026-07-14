import type { RuntimeLanguageProfile } from "./types";

const languageSignals = [
  { language: "Spanish", match: /\b(hola|gracias|reunion|llamada)\b/iu },
  { language: "French", match: /\b(bonjour|merci|rendez-vous)\b/iu },
  { language: "Arabic", match: /[\u0600-\u06FF]/u },
  { language: "Hindi", match: /[\u0900-\u097F]/u },
  { language: "Mandarin", match: /[\u4E00-\u9FFF]/u },
  { language: "Urdu", match: /[\u0600-\u06FF].*\b(urdu|pakistan)\b/iu }
] as const;

export function detectRuntimeLanguage(input: {
  readonly transcript: string;
  readonly preferredLanguage?: string;
}): RuntimeLanguageProfile {
  const preferredLanguage = input.preferredLanguage?.trim();

  if (preferredLanguage) {
    return {
      confidence: 0.92,
      dialect: null,
      fallbackUsed: false,
      language: preferredLanguage
    };
  }

  const signal = languageSignals.find((candidate) => candidate.match.test(input.transcript));

  if (signal) {
    return {
      confidence: 0.82,
      dialect: null,
      fallbackUsed: false,
      language: signal.language
    };
  }

  return {
    confidence: 0.55,
    dialect: null,
    fallbackUsed: true,
    language: "English"
  };
}