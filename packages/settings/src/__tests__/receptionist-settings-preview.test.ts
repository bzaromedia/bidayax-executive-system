import { describe, expect, it } from "vitest";
import type { ReceptionistSettings } from "@bidayax/types";
import { createReceptionistSettingsPreview } from "../receptionist-settings-preview";

const generatedAt = "2026-07-08T16:00:00.000Z";

function settings(
  overrides: Partial<ReceptionistSettings> = {}
): ReceptionistSettings {
  return {
    afterHoursBehavior: "queue_next_business_day",
    appointmentRules: {
      allowedWindows: [],
      calendarUrl: null,
      enabled: false,
      requireHumanApproval: true,
      timezone: "America/New_York"
    },
    callRoutingRules: [
      {
        action: "queue_callback",
        condition: "intent is callback",
        destination: "internal callback queue",
        enabled: true,
        intent: "request_callback",
        label: "Callback queue",
        priority: "high",
        ruleId: "callback"
      }
    ],
    consentDisclosure: "This AI receptionist may route and summarize your request.",
    customGreeting: null,
    defaultLanguage: "English",
    enabled: true,
    escalationContacts: [],
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

describe("receptionist settings preview", () => {
  it("creates an immutable ready preview from valid settings", () => {
    const preview = createReceptionistSettingsPreview(settings(), generatedAt);

    expect(preview.status).toBe("ready");
    expect(preview.effectiveGreeting).toBe(
      "Welcome. I can help route your request."
    );
    expect(preview.languageSummary).toBe("English default / 2 supported");
    expect(preview.routingRuleCount).toBe(1);
    expect(preview.validation.valid).toBe(true);
    expect(Object.isFrozen(preview)).toBe(true);
  });

  it("uses the custom greeting in preview mode", () => {
    const preview = createReceptionistSettingsPreview(
      settings({ customGreeting: "Welcome to the executive office.", greetingMode: "custom" }),
      generatedAt
    );

    expect(preview.effectiveGreeting).toBe("Welcome to the executive office.");
  });

  it("marks invalid enabled settings without changing them", () => {
    const input = settings({ consentDisclosure: "" });
    const preview = createReceptionistSettingsPreview(input, generatedAt);

    expect(preview.status).toBe("invalid");
    expect(preview.validation.valid).toBe(false);
    expect(input.consentDisclosure).toBe("");
  });

  it("marks valid disabled settings as disabled", () => {
    const preview = createReceptionistSettingsPreview(
      settings({
        consentDisclosure: "",
        enabled: false,
        recordingPolicy: "disabled"
      }),
      generatedAt
    );

    expect(preview.status).toBe("disabled");
    expect(preview.validation.valid).toBe(true);
  });
});
