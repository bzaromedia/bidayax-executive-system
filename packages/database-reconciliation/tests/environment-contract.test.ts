import { describe, expect, it } from "vitest";

import { validateEnvironmentVariables } from "../src/environment-contract.js";

function makeBaseEnvironment() {
  return new Map([
    ["NODE_ENV", "production"],
    ["DATABASE_URL", "postgres://example"],
    ["DATABASE_SSL", "false"],
    ["PG_POOL_MAX", "10"],
    ["POSTGRES_DB", "bidayax"],
    ["POSTGRES_USER", "bidayax"],
    ["POSTGRES_PASSWORD", "secret"],
    ["APP_BASE_URL", "https://theexecutivecard.online"],
    ["CARD_BASE_URL", "https://theexecutivecard.online"],
    ["DASHBOARD_BASE_URL", "https://dashboard.theexecutivecard.online"],
    ["NEXT_PUBLIC_DASHBOARD_BASE_URL", "https://dashboard.theexecutivecard.online"],
    ["BIDAYAX_IP_HASH_SECRET", "secret"],
    ["WORKOS_CLIENT_ID", "client"],
    ["WORKOS_API_KEY", "secret"],
    ["WORKOS_WEBHOOK_SECRET", "secret"],
    ["WORKOS_REDIRECT_URI", "https://dashboard.theexecutivecard.online/auth/callback"],
    ["WORKOS_ISSUER", "https://api.workos.com/"],
    ["IDENTITY_TRANSACTION_ENCRYPTION_KEY", "secret"],
    ["IDENTITY_SECURE_COOKIES", "true"],
    ["IDENTITY_ALLOWED_REDIRECT_ORIGINS", "https://dashboard.theexecutivecard.online"],
    ["IDENTITY_SESSION_IDLE_SECONDS", "1800"],
    ["IDENTITY_SESSION_ABSOLUTE_SECONDS", "28800"],
    ["IDENTITY_CLOCK_SKEW_SECONDS", "60"],
    ["TELEPHONY_PROVIDER", "mock"],
    ["TELEPHONY_PROVIDER_MODE", "disabled"],
    ["VOICE_RUNTIME_PROVIDER", "none"],
    ["VOICE_AGENT_ENABLED", "false"],
    ["VOICE_TEST_MODE", "true"],
    ["LIVE_INBOUND_CALLS_ENABLED", "false"],
    ["OUTBOUND_CALLS_ENABLED", "false"],
    ["ALLOW_PRODUCTION_CALLS", "false"],
    ["REQUIRE_HUMAN_APPROVAL", "true"],
    ["CALL_TRANSFER_ENABLED", "false"],
    ["VOICE_RECORDING_DISCLOSURE_ENABLED", "false"]
  ]);
}

describe("environment contract validator", () => {
  it("fails closed on missing WorkOS variables", () => {
    const environment = makeBaseEnvironment();
    environment.delete("WORKOS_CLIENT_ID");
    const results = validateEnvironmentVariables(environment);

    expect(results.find((result) => result.variable === "WORKOS_CLIENT_ID")?.classification).toBe(
      "MISSING_REQUIRED"
    );
  });

  it("classifies mock disabled telephony as safe", () => {
    const results = validateEnvironmentVariables(makeBaseEnvironment());

    expect(results.find((result) => result.variable === "TELEPHONY_PROVIDER")?.classification).toBe(
      "SAFE_DISABLED"
    );
  });

  it("rejects sandbox mock telephony in production reconciliation", () => {
    const environment = makeBaseEnvironment();
    environment.set("TELEPHONY_PROVIDER_MODE", "sandbox");
    const results = validateEnvironmentVariables(environment);

    expect(results.find((result) => result.variable === "TELEPHONY_PROVIDER")?.classification).toBe(
      "PRESENT_INVALID"
    );
  });

  it("rejects a real provider even when call controls are disabled", () => {
    const environment = makeBaseEnvironment();
    environment.set("TELEPHONY_PROVIDER", "twilio");
    const results = validateEnvironmentVariables(environment);

    expect(results.find((result) => result.variable === "TELEPHONY_PROVIDER")?.classification).toBe(
      "PRESENT_INVALID"
    );
  });

  it("rejects active voice guardrails", () => {
    const environment = makeBaseEnvironment();
    environment.set("VOICE_AGENT_ENABLED", "true");
    const results = validateEnvironmentVariables(environment);

    expect(results.find((result) => result.variable === "TELEPHONY_PROVIDER")?.classification).toBe(
      "PRESENT_INVALID"
    );
  });
});
