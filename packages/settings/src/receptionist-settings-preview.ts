import type { ReceptionistSettings } from "@bidayax/types";
import {
  validateReceptionistSettings,
  type ReceptionistSettingsValidationResult
} from "./receptionist-settings-validation";

export type ReceptionistSettingsPreview = {
  readonly consentConfigured: boolean;
  readonly effectiveGreeting: string;
  readonly enabled: boolean;
  readonly fallbackBehavior: ReceptionistSettings["fallbackBehavior"];
  readonly generatedAt: string;
  readonly languageSummary: string;
  readonly mood: ReceptionistSettings["mood"];
  readonly recordingPolicy: ReceptionistSettings["recordingPolicy"];
  readonly routingRuleCount: number;
  readonly status: "disabled" | "invalid" | "ready";
  readonly validation: ReceptionistSettingsValidationResult;
  readonly voiceProfile: ReceptionistSettings["voiceProfile"];
};

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry);
  }

  return value;
}

export function createReceptionistSettingsPreview(
  settings: ReceptionistSettings,
  generatedAt = new Date().toISOString()
): ReceptionistSettingsPreview {
  const validation = validateReceptionistSettings(settings);
  const effectiveGreeting =
    settings.greetingMode === "custom"
      ? settings.customGreeting?.trim() ?? ""
      : settings.standardGreeting.trim();

  return deepFreeze({
    consentConfigured: settings.consentDisclosure.trim().length > 0,
    effectiveGreeting,
    enabled: settings.enabled,
    fallbackBehavior: settings.fallbackBehavior,
    generatedAt,
    languageSummary: `${settings.defaultLanguage} default / ${settings.supportedLanguages.length} supported`,
    mood: settings.mood,
    recordingPolicy: settings.recordingPolicy,
    routingRuleCount: settings.callRoutingRules.filter((rule) => rule.enabled).length,
    status: !settings.enabled ? "disabled" : validation.valid ? "ready" : "invalid",
    validation,
    voiceProfile: settings.voiceProfile
  });
}
