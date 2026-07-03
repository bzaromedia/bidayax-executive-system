import { describe, expect, it } from "vitest";
import { executiveProfiles } from "@bidayax/config/executives";
import { createCustomizationAuditEvent } from "../src/customization-audit";
import {
  createCustomerCardSettingsFromExecutiveProfile,
  getDefaultCustomerCardSettings
} from "../src/customization-profile";
import { resolveQrTransferFeedbackSettings } from "../src/qr-feedback-settings";
import { receptionistSettingsConfigSchema } from "../src/settings-validation";

describe("customization profile", () => {
  it("creates settings for every production executive card", () => {
    const settings = executiveProfiles.map((profile) =>
      createCustomerCardSettingsFromExecutiveProfile(profile)
    );

    expect(settings).toHaveLength(3);
    expect(settings.map((item) => item.profile.executiveSlug).sort()).toEqual([
      "ad-garner",
      "naimah-barnes",
      "sean-hall"
    ]);
  });

  it("keeps production card URLs available by slug", () => {
    expect(getDefaultCustomerCardSettings("ad-garner")?.profile.executiveSlug).toBe(
      "ad-garner"
    );
    expect(getDefaultCustomerCardSettings("naimah-barnes")?.profile.executiveSlug).toBe(
      "naimah-barnes"
    );
    expect(getDefaultCustomerCardSettings("sean-hall")?.profile.executiveSlug).toBe(
      "sean-hall"
    );
  });

  it("resolves QR feedback settings from configuration", () => {
    const settings = createCustomerCardSettingsFromExecutiveProfile(executiveProfiles[0]!);
    const feedback = resolveQrTransferFeedbackSettings({
      ...settings.qrFeedback,
      soundEnabled: true
    });

    expect(feedback.soundEnabled).toBe(true);
  });

  it("validates settings API payloads", () => {
    const settings = createCustomerCardSettingsFromExecutiveProfile(executiveProfiles[0]!);

    expect(receptionistSettingsConfigSchema.safeParse(settings.receptionist).success).toBe(
      true
    );
  });

  it("creates a settings audit event", () => {
    const event = createCustomizationAuditEvent({
      actor: "execadmin",
      affectedCard: "ad-garner",
      newValue: { enabled: false },
      oldValue: { enabled: true },
      settingType: "receptionist"
    });

    expect(event.affectedCard).toBe("ad-garner");
    expect(event.oldValueHash).not.toBe(event.newValueHash);
  });
});


