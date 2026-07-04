import {
  receptionistLanguages,
  type ReceptionistLanguage
} from "@bidayax/types";

export function classifyReceptionistLanguage(value: string): ReceptionistLanguage {
  const normalized = value.trim().toLowerCase();
  const match = receptionistLanguages.find(
    (language) => language.toLowerCase() === normalized
  );

  return match ?? "English";
}

export function getReceptionistLanguageDirection(language: ReceptionistLanguage) {
  return language === "Arabic" || language === "Urdu" ? "rtl" : "ltr";
}
