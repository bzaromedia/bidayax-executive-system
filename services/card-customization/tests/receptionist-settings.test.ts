import { describe, expect, it } from "vitest";
import type { ReceptionistSettingsConfig } from "@bidayax/types";
import {
  defaultReceptionistGreeting,
  resolveReceptionistBehavior,
  validateReceptionistSettings
} from "../src/receptionist-settings";

const baseSettings: ReceptionistSettingsConfig = {
  consentRequired: true,
  customGreeting: null,
  defaultLanguage: "English",
  enabled: true,
  executiveSlug: "ad-garner",
  greetingMode: "standard",
  handoffEmail: "contact@theexecutivecard.com",
  meetingBehavior: "internal_request",
  mood: "confident",
  receptionistId: "ad-garner-receptionist",
  requestTypes: ["schedule_meeting", "request_callback"],
  responseTone: "professional",
  standardGreeting: defaultReceptionistGreeting,
  supportedLanguages: ["English", "Spanish"],
  voiceStyle: "executive"
};

describe("receptionist settings", () => {
  it("resolves a safe custom greeting", () => {
    const behavior = resolveReceptionistBehavior({
      ...baseSettings,
      customGreeting: "Welcome to the executive desk. How can we route your request?",
      greetingMode: "custom"
    });

    expect(behavior.greetingText).toContain("executive desk");
    expect(behavior.safeProviderStatus).toBe("foundation_ready");
  });

  it("rejects unsupported mood", () => {
    const issues = validateReceptionistSettings({
      ...baseSettings,
      mood: "casual" as never
    });

    expect(issues.some((issue) => issue.field === "mood")).toBe(true);
  });

  it("rejects unsupported language", () => {
    const issues = validateReceptionistSettings({
      ...baseSettings,
      supportedLanguages: ["English", "Elvish"]
    });

    expect(issues.some((issue) => issue.field === "supportedLanguages")).toBe(true);
  });
});
