import { describe, expect, it } from "vitest";
import {
  assertDevelopmentIdentityAllowed,
  isAllowedReturnTo,
  readIdentityEnvironment
} from "../environment";

describe("identity environment", () => {
  it("fails closed when mandatory production configuration is absent", () => {
    expect(readIdentityEnvironment({ NODE_ENV: "production" }).configured).toBe(false);
  });

  it("blocks development identity simulation in production", () => {
    expect(() =>
      assertDevelopmentIdentityAllowed({
        IDENTITY_DEVELOPMENT_MODE: "true",
        NODE_ENV: "production"
      })
    ).toThrow(/forbidden/);
  });

  it("requires explicit development-mode activation", () => {
    expect(() => assertDevelopmentIdentityAllowed({ NODE_ENV: "test" })).toThrow(
      /not enabled/
    );
  });

  it("rejects return URLs outside the allowlist", () => {
    expect(
      isAllowedReturnTo("https://evil.example/steal", {
        allowedRedirectOrigins: ["https://dashboard.example.test"],
        applicationBaseUrl: "https://dashboard.example.test"
      })
    ).toBe(false);
  });
  it("rejects weak transaction encryption keys", () => {
    const result = readIdentityEnvironment({
      APP_BASE_URL: "https://dashboard.example.test",
      IDENTITY_TRANSACTION_ENCRYPTION_KEY: "short",
      WORKOS_API_KEY: "workos_api_valid_value",
      WORKOS_CLIENT_ID: "client_valid",
      WORKOS_REDIRECT_URI: "https://dashboard.example.test/auth/callback",
      WORKOS_WEBHOOK_SECRET: "webhook_valid_value"
    });
    expect(result.configured).toBe(false);
    if (!result.configured) {
      expect(result.errors.join(" ")).toContain("at least 32 characters");
    }
  });

  it("rejects wildcard redirect origins", () => {
    const result = readIdentityEnvironment({
      APP_BASE_URL: "https://dashboard.example.test",
      IDENTITY_ALLOWED_REDIRECT_ORIGINS: "https://*.example.test",
      IDENTITY_TRANSACTION_ENCRYPTION_KEY: "identity-transaction-key-32-chars",
      WORKOS_API_KEY: "workos_api_valid_value",
      WORKOS_CLIENT_ID: "client_valid",
      WORKOS_REDIRECT_URI: "https://dashboard.example.test/auth/callback",
      WORKOS_WEBHOOK_SECRET: "webhook_valid_value"
    });
    expect(result.configured).toBe(false);
    if (!result.configured) {
      expect(result.errors.join(" ")).toContain("wildcards");
    }
  });

  it("requires secure cookies in production", () => {
    const result = readIdentityEnvironment({
      APP_BASE_URL: "https://dashboard.example.test",
      IDENTITY_TRANSACTION_ENCRYPTION_KEY: "identity-transaction-key-32-chars",
      NODE_ENV: "production",
      WORKOS_API_KEY: "workos_api_valid_value",
      WORKOS_CLIENT_ID: "client_valid",
      WORKOS_REDIRECT_URI: "https://dashboard.example.test/auth/callback",
      WORKOS_WEBHOOK_SECRET: "webhook_valid_value"
    });
    expect(result.configured).toBe(false);
    if (!result.configured) {
      expect(result.errors.join(" ")).toContain("IDENTITY_SECURE_COOKIES=true");
    }
  });

  it("rejects placeholder secrets in production", () => {
    const result = readIdentityEnvironment({
      APP_BASE_URL: "https://dashboard.example.test",
      IDENTITY_SECURE_COOKIES: "true",
      IDENTITY_TRANSACTION_ENCRYPTION_KEY: "placeholder",
      NODE_ENV: "production",
      WORKOS_API_KEY: "redacted",
      WORKOS_CLIENT_ID: "client_valid",
      WORKOS_REDIRECT_URI: "https://dashboard.example.test/auth/callback",
      WORKOS_WEBHOOK_SECRET: "webhook_valid_value"
    });
    expect(result.configured).toBe(false);
    if (!result.configured) {
      expect(result.errors.join(" ")).toContain("placeholder value");
    }
  });
});
