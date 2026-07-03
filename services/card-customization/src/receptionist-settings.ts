import { receptionistLanguageOptions } from "@bidayax/config/receptionist";
import {
  cardCustomizationMoods,
  cardCustomizationRequestTypes,
  cardCustomizationVoiceStyles,
  type CardCustomizationMood,
  type CardCustomizationRequestType,
  type CardCustomizationVoiceStyle,
  type ReceptionistSettingsConfig
} from "@bidayax/types";

export const defaultReceptionistGreeting =
  "Welcome. I can help route your request, schedule a meeting, or connect you with the right executive contact.";

export type ReceptionistSettingsIssue = {
  readonly field: keyof ReceptionistSettingsConfig;
  readonly message: string;
};

export type ResolvedReceptionistBehavior = {
  readonly greetingText: string;
  readonly issues: readonly ReceptionistSettingsIssue[];
  readonly notificationPayload: {
    readonly executiveSlug: string;
    readonly language: string;
    readonly requestType: string;
    readonly to: string;
  };
  readonly routingBehavior: "disabled" | "handoff_email" | "invalid";
  readonly safeProviderStatus: "disabled" | "foundation_ready" | "invalid";
};

const supportedLanguageValues = new Set<string>(
  receptionistLanguageOptions.map((language) => language.value)
);

function isSupportedVoiceStyle(
  value: string
): value is CardCustomizationVoiceStyle {
  return (cardCustomizationVoiceStyles as readonly string[]).includes(value);
}

function isSupportedMood(value: string): value is CardCustomizationMood {
  return (cardCustomizationMoods as readonly string[]).includes(value);
}

function isSupportedRequestType(
  value: string
): value is CardCustomizationRequestType {
  return (cardCustomizationRequestTypes as readonly string[]).includes(value);
}

function hasUnsafeGreetingContent(value: string) {
  return /<script|javascript:|autonomous calling|live calling/i.test(value);
}

export function validateReceptionistSettings(
  settings: ReceptionistSettingsConfig
): readonly ReceptionistSettingsIssue[] {
  const issues: ReceptionistSettingsIssue[] = [];

  if (!isSupportedVoiceStyle(settings.voiceStyle)) {
    issues.push({ field: "voiceStyle", message: "Unsupported voice style." });
  }

  if (!isSupportedMood(settings.mood)) {
    issues.push({ field: "mood", message: "Unsupported mood." });
  }

  if (!settings.supportedLanguages.every((language) => supportedLanguageValues.has(language))) {
    issues.push({ field: "supportedLanguages", message: "Unsupported language." });
  }

  if (!supportedLanguageValues.has(settings.defaultLanguage)) {
    issues.push({ field: "defaultLanguage", message: "Unsupported default language." });
  }

  if (!settings.requestTypes.every((requestType) => isSupportedRequestType(requestType))) {
    issues.push({ field: "requestTypes", message: "Unsupported request type." });
  }

  if (settings.greetingMode === "custom") {
    const greeting = settings.customGreeting?.trim() ?? "";

    if (!greeting) {
      issues.push({ field: "customGreeting", message: "Custom greeting is required." });
    }

    if (hasUnsafeGreetingContent(greeting)) {
      issues.push({ field: "customGreeting", message: "Custom greeting is unsafe." });
    }
  }

  return issues;
}

export function resolveReceptionistBehavior(
  settings: ReceptionistSettingsConfig,
  options?: Partial<{
    readonly language: string;
    readonly requestType: string;
  }>
): ResolvedReceptionistBehavior {
  const issues = validateReceptionistSettings(settings);
  const greetingText =
    settings.greetingMode === "custom" && settings.customGreeting
      ? settings.customGreeting
      : settings.standardGreeting;
  const language = options?.language ?? settings.defaultLanguage;
  const requestType = options?.requestType ?? settings.requestTypes[0] ?? "general_inquiry";

  if (!settings.enabled) {
    return {
      greetingText,
      issues,
      notificationPayload: {
        executiveSlug: settings.executiveSlug,
        language,
        requestType,
        to: settings.handoffEmail
      },
      routingBehavior: "disabled",
      safeProviderStatus: "disabled"
    };
  }

  if (issues.length > 0) {
    return {
      greetingText: settings.standardGreeting,
      issues,
      notificationPayload: {
        executiveSlug: settings.executiveSlug,
        language,
        requestType,
        to: settings.handoffEmail
      },
      routingBehavior: "invalid",
      safeProviderStatus: "invalid"
    };
  }

  return {
    greetingText,
    issues,
    notificationPayload: {
      executiveSlug: settings.executiveSlug,
      language,
      requestType,
      to: settings.handoffEmail
    },
    routingBehavior: "handoff_email",
    safeProviderStatus: "foundation_ready"
  };
}

