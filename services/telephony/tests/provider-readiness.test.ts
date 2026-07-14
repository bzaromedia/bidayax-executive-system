import { describe, expect, it } from "vitest";
import {
  getLiveProviderRuntimeConfig,
  getProviderReadinessChecks
} from "../src/provider-readiness";

describe("provider readiness", () => {
  it("fails Twilio readiness when configuration is missing", () => {
    const checks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({ TELEPHONY_PROVIDER: "twilio" })
    );

    expect(
      checks.find((check) => check.checkName === "twilio_required_configuration")
        ?.status
    ).toBe("failed");
  });

  it("passes Twilio readiness when required configuration exists", () => {
    const checks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({
        TELEPHONY_PROVIDER: "twilio",
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token",
        TWILIO_PHONE_NUMBER: "+15551234567"
      })
    );

    expect(
      checks.find((check) => check.checkName === "twilio_required_configuration")
        ?.status
    ).toBe("passed");
  });

  it("does not expose secrets in readiness details", () => {
    const checks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({
        OPENAI_API_KEY: "sk-secret",
        OPENAI_REALTIME_MODEL: "gpt-realtime",
        TWILIO_AUTH_TOKEN: "secret-token"
      })
    );
    const details = checks.map((check) => check.details).join(" ");

    expect(details).not.toContain("sk-secret");
    expect(details).not.toContain("secret-token");
  });

  it("reports sandbox provider mode without enabling production calls", () => {
    const checks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({
        TELEPHONY_PROVIDER_MODE: "sandbox",
        TELEPHONY_SANDBOX_WEBHOOK_SECRET: "test-secret"
      })
    );

    expect(
      checks.find((check) => check.checkName === "sandbox_provider_mode")?.status
    ).toBe("passed");
    expect(
      checks.find((check) => check.checkName === "sandbox_webhook_signature_policy")
        ?.status
    ).toBe("passed");
    expect(
      checks.find((check) => check.checkName === "production_provider_mode_gate")
        ?.status
    ).toBe("passed");
  });

  it("fails readiness when production provider mode is requested", () => {
    const checks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({ TELEPHONY_PROVIDER_MODE: "production" })
    );

    expect(
      checks.find((check) => check.checkName === "production_provider_mode_gate")
        ?.status
    ).toBe("failed");
  });
});
