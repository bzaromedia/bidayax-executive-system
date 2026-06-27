import type {
  ReceptionistLanguageProfile,
  SupportedReceptionistLanguage
} from "@bidayax/types";

const languageProfiles = {
  Arabic: { direction: "rtl", script: "Arabic" },
  Cantonese: { direction: "ltr", script: "Traditional Chinese" },
  English: { direction: "ltr", script: "Latin" },
  French: { direction: "ltr", script: "Latin" },
  German: { direction: "ltr", script: "Latin" },
  Hindi: { direction: "ltr", script: "Devanagari" },
  Japanese: { direction: "ltr", script: "Japanese" },
  Korean: { direction: "ltr", script: "Hangul" },
  Mandarin: { direction: "ltr", script: "Simplified Chinese" },
  Portuguese: { direction: "ltr", script: "Latin" },
  Russian: { direction: "ltr", script: "Cyrillic" },
  Spanish: { direction: "ltr", script: "Latin" },
  Urdu: { direction: "rtl", script: "Arabic" }
} as const satisfies Record<
  SupportedReceptionistLanguage,
  { readonly direction: "ltr" | "rtl"; readonly script: string }
>;

export function createLanguageProfile({
  dialect,
  language
}: {
  readonly dialect?: string | null;
  readonly language: SupportedReceptionistLanguage | "Unknown";
}): ReceptionistLanguageProfile {
  if (language === "Unknown") {
    return {
      confidence: 0.25,
      dialect: dialect ?? null,
      direction: "unknown",
      language,
      notes:
        "Simulated profile only. Live fluency depends on the future voice and language stack.",
      script: "unknown"
    };
  }

  const profile = languageProfiles[language];

  return {
    confidence: 0.85,
    dialect: dialect ?? null,
    direction: profile.direction,
    language,
    notes:
      "Simulated language metadata. Phase 8 does not claim live conversation fluency.",
    script: profile.script
  };
}
