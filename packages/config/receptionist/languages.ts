import type { ReceptionistLanguage } from "@bidayax/types";

export const receptionistLanguageOptions = [
  {
    label: "English",
    value: "English"
  },
  {
    label: "Spanish",
    value: "Spanish"
  },
  {
    label: "Arabic",
    value: "Arabic"
  },
  {
    label: "French",
    value: "French"
  },
  {
    label: "Mandarin",
    value: "Mandarin"
  },
  {
    label: "Urdu",
    value: "Urdu"
  },
  {
    label: "Hindi",
    value: "Hindi"
  }
] as const satisfies readonly {
  readonly label: string;
  readonly value: ReceptionistLanguage;
}[];

