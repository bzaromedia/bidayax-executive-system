import { describe, expect, it } from "vitest";
import {
  getLiveProviderRuntimeConfig,
  getProviderReadinessChecks
} from "../src/provider-readiness";

describe("provider readiness", () => {
  it("defaults missing, unknown, mixed-case, and padded provider modes to disabled", () => {
    for (const mode of [undefined, "carrier", "Sandbox", " sandbox "]) {
      const config = getLiveProviderRuntimeConfig(
        mode === undefined ? {} : { TELEPHONY_PROVIDER_MODE: mode }
      );

      expect(config.telephonyProviderExecutionMode).toBe("disabled");
    }
  });

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
        TELEPHONY_SANDBOX_WEBHOOK_SECRET: "test-sandbox-secret-32-bytes",
        TWILIO_AUTH_TOKEN: "secret-token"
      })
    );
    const details = checks.map((check) => check.details).join(" ");

    expect(details).not.toContain("sk-secret");
    expect(details).not.toContain("secret-token");
    expect(details).not.toContain("test-sandbox-secret-32-bytes");
  });

  it("reports sandbox provider mode without enabling production calls", () => {
    const checks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({
        TELEPHONY_PROVIDER_MODE: "sandbox",
        TELEPHONY_SANDBOX_WEBHOOK_SECRET: "test-sandbox-secret-32-bytes"
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

  it("fails sandbox readiness without a strong sandbox secret", () => {
    const missing = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({ TELEPHONY_PROVIDER_MODE: "sandbox" })
    );
    const weak = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({
        TELEPHONY_PROVIDER_MODE: "sandbox",
        TELEPHONY_SANDBOX_WEBHOOK_SECRET: "secret"
      })
    );

    expect(
      missing.find((check) => check.checkName === "sandbox_webhook_signature_policy")
        ?.status
    ).toBe("failed");
    expect(
      weak.find((check) => check.checkName === "sandbox_webhook_signature_policy")
        ?.status
    ).toBe("failed");
  });

  it("fails readiness when sandbox or production provider mode is requested in production", () => {
    const sandboxChecks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({
        NODE_ENV: "production",
        TELEPHONY_PROVIDER_MODE: "sandbox",
        TELEPHONY_SANDBOX_WEBHOOK_SECRET: "test-sandbox-secret-32-bytes"
      })
    );
    const productionChecks = getProviderReadinessChecks(
      getLiveProviderRuntimeConfig({ TELEPHONY_PROVIDER_MODE: "production" })
    );

    expect(
      sandboxChecks.find((check) => check.checkName === "sandbox_environment_gate")
        ?.status
    ).toBe("failed");
    expect(
      productionChecks.find((check) => check.checkName === "production_provider_mode_gate")
        ?.status
    ).toBe("failed");
  });
});
