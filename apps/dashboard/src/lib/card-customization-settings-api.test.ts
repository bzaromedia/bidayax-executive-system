import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSettingsPayload } from "./card-customization-settings-api";
import { createTrustedSettingsAuthToken } from "./settings-auth-context";

const originalSecret = process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET;

function createToken(tenantId: string) {
  return createTrustedSettingsAuthToken({
    claims: {
      actorId: "admin-1",
      displayName: "Admin",
      role: "administrator",
      tenantId
    },
    secret: "test-secret"
  });
}

function createRequest(token?: string) {
  const url = "https://dashboard.test/api/settings/card-customization/ad-garner";

  if (!token) {
    return new Request(url);
  }

  return new Request(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
}

function latestLog(spy: ReturnType<typeof vi.spyOn>) {
  const [line] = spy.mock.calls.at(-1) ?? [];

  if (typeof line !== "string") {
    throw new Error("Expected settings API structured log line.");
  }

  return JSON.parse(line) as {
    readonly component: string;
    readonly metadata: Record<string, string>;
    readonly requestId: string;
  };
}

describe("card customization settings API", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET = "test-secret";
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET = originalSecret;
    infoSpy.mockRestore();
  });

  it("returns unauthenticated only for missing trusted settings sessions", async () => {
    const response = getSettingsPayload(createRequest(), "ad-garner", "card-customization");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("unauthenticated");
    expect(latestLog(infoSpy).metadata).toMatchObject({
      errorCode: "unauthenticated",
      outcome: "authentication_failure",
      status: 401
    });
  });

  it("returns authorization_failed for trusted sessions outside the tenant", async () => {
    const response = getSettingsPayload(
      createRequest(createToken("tenant-other")),
      "ad-garner",
      "card-customization"
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("authorization_failed");
    expect(latestLog(infoSpy).metadata).toMatchObject({
      errorCode: "authorization_failed",
      outcome: "authorization_failure",
      status: 403
    });
  });

  it("logs a sanitized success outcome without request secrets", async () => {
    const response = getSettingsPayload(
      createRequest(createToken("bidayax-llc")),
      "ad-garner",
      "card-customization"
    );

    expect(response.status).toBe(200);

    const logLine = JSON.stringify(latestLog(infoSpy));
    expect(logLine).toContain("settings-api-route");
    expect(logLine).toContain("success");
    expect(logLine).not.toContain("Bearer");
    expect(logLine).not.toContain("test-secret");
    expect(logLine).not.toContain("authorization");
    expect(logLine).not.toContain("cookie");
  });
});