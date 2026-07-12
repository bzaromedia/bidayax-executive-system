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
});
