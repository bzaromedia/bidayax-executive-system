import { describe, expect, it } from "vitest";
import type { ReceptionistSettings } from "@bidayax/types";
import { validateReceptionistSettings } from "../receptionist-settings-validation";

function validSettings(
  overrides: Partial<ReceptionistSettings> = {}
): ReceptionistSettings {
  return {
    afterHoursBehavior: "queue_next_business_day",
    appointmentRules: {
      allowedWindows: ["weekday-business-hours"],
      calendarUrl: null,
      enabled: true,
      requireHumanApproval: true,
      timezone: "America/New_York"
    },
    callRoutingRules: [
      {
        action: "route_to_email",
        condition: "intent is general inquiry",
        destination: "contact@theexecutivecard.com",
        enabled: true,
        intent: "general_inquiry",
        label: "General inquiry handoff",
        priority: "medium",
        ruleId: "route-general"
      }
    ],
    consentDisclosure: "This AI receptionist may route and summarize your request.",
    customGreeting: null,
    defaultLanguage: "English",
    enabled: true,
    escalationContacts: [
      {
        contactId: "primary-handoff",
        email: "contact@theexecutivecard.com",
        label: "Executive contact",
        phone: null,
        preferredContactMethod: "email",
        priority: "high"
      }
    ],
    fallbackBehavior: "queue_callback",
    greetingMode: "standard",
    mood: "confident",
    recordingPolicy: "transcript_only",
    standardGreeting: "Welcome. I can help route your request.",
    supportedLanguages: ["English", "Spanish"],
    tenantId: "tenant-bidayax",
    voiceProfile: "professional",
    ...overrides
  };
}

describe("receptionist settings validation", () => {
  it("accepts complete provider-independent settings", () => {
    expect(validateReceptionistSettings(validSettings())).toEqual({
      issues: [],
      valid: true
    });
  });

  it("requires enabled to be boolean", () => {
    const result = validateReceptionistSettings({
      ...validSettings(),
      enabled: "yes"
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "enabled.invalid" })
    );
  });

  it("requires supported languages to include the default language", () => {
    const result = validateReceptionistSettings(
      validSettings({ supportedLanguages: ["Spanish"] })
    );

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "default_language.not_supported" })
    );
  });

  it("rejects unsupported voice and mood values", () => {
    const result = validateReceptionistSettings({
      ...validSettings(),
      mood: "casual",
      voiceProfile: "celebrity"
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["voice_profile.required", "mood.invalid"])
    );
  });

  it("requires a custom greeting in custom mode", () => {
    const result = validateReceptionistSettings(
      validSettings({ customGreeting: "", greetingMode: "custom" })
    );

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "custom_greeting.required" })
    );
  });

  it("requires consent when automation or recording is enabled", () => {
    const result = validateReceptionistSettings(
      validSettings({ consentDisclosure: "" })
    );

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "consent_disclosure.required" })
    );
  });

  it("requires routing condition, destination, and approved priority", () => {
    const result = validateReceptionistSettings({
      ...validSettings(),
      callRoutingRules: [
        {
          action: "route_to_email",
          condition: "",
          destination: "",
          enabled: true,
          intent: "general_inquiry",
          label: "Broken route",
          priority: "immediate",
          ruleId: "broken-route"
        }
      ]
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "routing_rule.condition.required",
        "routing_rule.destination.required",
        "routing_rule.priority.invalid"
      ])
    );
  });

  it("requires escalation contact name and a valid contact method", () => {
    const result = validateReceptionistSettings({
      ...validSettings(),
      escalationContacts: [
        {
          contactId: "broken-contact",
          email: "invalid",
          label: "",
          phone: null,
          priority: "high"
        }
      ]
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "escalation_contact.name.required",
        "escalation_contact.method.invalid"
      ])
    );
  });
});
