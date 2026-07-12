import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSettingsPayload } from "./card-customization-settings-api";

function createRequest() {
  return new Request(
    "https://dashboard.test/api/settings/card-customization/ad-garner"
  );
}

function latestLog(spy: ReturnType<typeof vi.spyOn>) {
  const [line] = spy.mock.calls.at(-1) ?? [];
  if (typeof line !== "string") throw new Error("Expected settings API log line.");
  return JSON.parse(line) as {
    readonly component: string;
    readonly metadata: Record<string, string | number>;
  };
}

describe("card customization settings API", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("IDENTITY_DEVELOPMENT_MODE", "true");
    vi.stubEnv("IDENTITY_DEVELOPMENT_TENANT_ID", "bidayax-llc");
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    infoSpy.mockRestore();
  });

  it("returns authorization_failed when the explicit test tenant does not own the card", async () => {
    vi.stubEnv("IDENTITY_DEVELOPMENT_TENANT_ID", "tenant-other");
    const response = await getSettingsPayload(
      createRequest(),
      "ad-garner",
      "card-customization"
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("authorization_failed");
  });

  it("reads settings through an explicitly enabled non-production identity", async () => {
    const response = await getSettingsPayload(
      createRequest(),
      "ad-garner",
      "card-customization"
    );
    expect(response.status).toBe(200);
    const logLine = JSON.stringify(latestLog(infoSpy));
    expect(logLine).toContain("settings-api-route");
    expect(logLine).toContain("success");
    expect(logLine).not.toContain("authorization");
    expect(logLine).not.toContain("cookie");
    expect(logLine).not.toContain("token");
  });

  it("fails closed when neither production identity nor explicit test mode is configured", async () => {
    vi.stubEnv("IDENTITY_DEVELOPMENT_MODE", "false");
    const response = await getSettingsPayload(
      createRequest(),
      "ad-garner",
      "card-customization"
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("identity_unavailable");
  });
});
