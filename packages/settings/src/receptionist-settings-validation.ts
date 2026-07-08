import {
  receptionistAfterHoursBehaviors,
  receptionistFallbackBehaviors,
  receptionistGreetingModes,
  receptionistLanguages,
  receptionistMoods,
  receptionistPriorities,
  receptionistRecordingPolicies,
  receptionistRequestTypes,
  receptionistVoiceProfiles,
  type ReceptionistSettings
} from "@bidayax/types";

export type ReceptionistSettingsValidationIssue = {
  readonly code: string;
  readonly field: string;
  readonly message: string;
};

export type ReceptionistSettingsValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly ReceptionistSettingsValidationIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function includesValue(values: readonly string[], value: unknown): value is string {
  return typeof value === "string" && values.includes(value);
}

function isValidEmail(value: unknown): boolean {
  return hasText(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: unknown): boolean {
  if (!hasText(value)) {
    return false;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function addIssue(
  issues: ReceptionistSettingsValidationIssue[],
  code: string,
  field: string,
  message: string
): void {
  issues.push({ code, field, message });
}

function validateRoutingRules(
  value: unknown,
  issues: ReceptionistSettingsValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    addIssue(issues, "routing_rules.invalid", "callRoutingRules", "Routing rules must be an array.");
    return;
  }

  value.forEach((rule, index) => {
    const field = `callRoutingRules.${index}`;
    if (!isRecord(rule)) {
      addIssue(issues, "routing_rule.invalid", field, "Routing rule must be an object.");
      return;
    }

    if (!hasText(rule.condition)) {
      addIssue(issues, "routing_rule.condition.required", `${field}.condition`, "Routing condition is required.");
    }
    if (!hasText(rule.destination)) {
      addIssue(issues, "routing_rule.destination.required", `${field}.destination`, "Routing destination is required.");
    }
    if (!includesValue(receptionistPriorities, rule.priority)) {
      addIssue(issues, "routing_rule.priority.invalid", `${field}.priority`, "Routing priority is not approved.");
    }
    if (!includesValue([...receptionistRequestTypes, "urgent", "unknown"], rule.intent)) {
      addIssue(issues, "routing_rule.intent.invalid", `${field}.intent`, "Routing intent is not approved.");
    }
    if (typeof rule.enabled !== "boolean") {
      addIssue(issues, "routing_rule.enabled.invalid", `${field}.enabled`, "Routing enabled state must be boolean.");
    }
  });
}

function validateEscalationContacts(
  value: unknown,
  issues: ReceptionistSettingsValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    addIssue(issues, "escalation_contacts.invalid", "escalationContacts", "Escalation contacts must be an array.");
    return;
  }

  value.forEach((contact, index) => {
    const field = `escalationContacts.${index}`;
    if (!isRecord(contact)) {
      addIssue(issues, "escalation_contact.invalid", field, "Escalation contact must be an object.");
      return;
    }

    if (!hasText(contact.label)) {
      addIssue(issues, "escalation_contact.name.required", `${field}.label`, "Escalation contact name is required.");
    }

    const hasEmail = isValidEmail(contact.email);
    const hasPhone = contact.phone === null ? false : isValidPhone(contact.phone);
    if (!hasEmail && !hasPhone) {
      addIssue(
        issues,
        "escalation_contact.method.invalid",
        field,
        "Escalation contact requires a valid email address or phone number."
      );
    }

    if (
      contact.preferredContactMethod !== undefined &&
      contact.preferredContactMethod !== "email" &&
      contact.preferredContactMethod !== "phone"
    ) {
      addIssue(
        issues,
        "escalation_contact.preferred_method.invalid",
        `${field}.preferredContactMethod`,
        "Preferred contact method must be email or phone."
      );
    }
  });
}

export function validateReceptionistSettings(
  input: unknown
): ReceptionistSettingsValidationResult {
  const issues: ReceptionistSettingsValidationIssue[] = [];

  if (!isRecord(input)) {
    return {
      issues: [
        {
          code: "receptionist_settings.invalid",
          field: "receptionistSettings",
          message: "Receptionist settings must be an object."
        }
      ],
      valid: false
    };
  }

  if (typeof input.enabled !== "boolean") {
    addIssue(issues, "enabled.invalid", "enabled", "Enabled must be boolean.");
  }

  if (!includesValue(receptionistLanguages, input.defaultLanguage)) {
    addIssue(issues, "default_language.invalid", "defaultLanguage", "Default language is required and must be supported.");
  }

  if (!Array.isArray(input.supportedLanguages) || input.supportedLanguages.length === 0) {
    addIssue(issues, "supported_languages.required", "supportedLanguages", "At least one supported language is required.");
  } else {
    const invalidLanguage = input.supportedLanguages.some(
      (language) => !includesValue(receptionistLanguages, language)
    );
    if (invalidLanguage) {
      addIssue(issues, "supported_languages.invalid", "supportedLanguages", "Supported languages contain an unapproved value.");
    }
    if (
      hasText(input.defaultLanguage) &&
      !input.supportedLanguages.includes(input.defaultLanguage)
    ) {
      addIssue(issues, "default_language.not_supported", "supportedLanguages", "Supported languages must include the default language.");
    }
  }

  if (input.enabled === true && !includesValue(receptionistVoiceProfiles, input.voiceProfile)) {
    addIssue(issues, "voice_profile.required", "voiceProfile", "An approved voice profile is required when the receptionist is enabled.");
  }

  if (!includesValue(receptionistMoods, input.mood)) {
    addIssue(issues, "mood.invalid", "mood", "Mood is not an approved value.");
  }

  if (!includesValue(receptionistGreetingModes, input.greetingMode)) {
    addIssue(issues, "greeting_mode.invalid", "greetingMode", "Greeting mode must be standard or custom.");
  } else if (input.greetingMode === "custom" && !hasText(input.customGreeting)) {
    addIssue(issues, "custom_greeting.required", "customGreeting", "Custom greeting is required in custom greeting mode.");
  } else if (input.greetingMode === "standard" && !hasText(input.standardGreeting)) {
    addIssue(issues, "standard_greeting.required", "standardGreeting", "Standard greeting is required in standard greeting mode.");
  }

  if (!includesValue(receptionistRecordingPolicies, input.recordingPolicy)) {
    addIssue(issues, "recording_policy.invalid", "recordingPolicy", "Recording policy is not approved.");
  }

  if (
    (input.enabled === true || input.recordingPolicy !== "disabled") &&
    !hasText(input.consentDisclosure)
  ) {
    addIssue(
      issues,
      "consent_disclosure.required",
      "consentDisclosure",
      "Consent disclosure is required when automation or recording is enabled."
    );
  }

  if (!includesValue(receptionistFallbackBehaviors, input.fallbackBehavior)) {
    addIssue(issues, "fallback_behavior.invalid", "fallbackBehavior", "Fallback behavior is required and must be approved.");
  }

  if (!includesValue(receptionistAfterHoursBehaviors, input.afterHoursBehavior)) {
    addIssue(issues, "after_hours_behavior.invalid", "afterHoursBehavior", "After-hours behavior is not approved.");
  }

  validateRoutingRules(input.callRoutingRules, issues);
  validateEscalationContacts(input.escalationContacts, issues);

  return {
    issues,
    valid: issues.length === 0
  };
}

export function isValidReceptionistSettings(
  input: unknown
): input is ReceptionistSettings {
  return validateReceptionistSettings(input).valid;
}
