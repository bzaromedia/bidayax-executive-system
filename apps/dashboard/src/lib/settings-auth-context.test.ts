import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrustedSettingsAuthorizationContext } from "@bidayax/types";

const { resolveDashboardIdentity } = vi.hoisted(() => ({
  resolveDashboardIdentity: vi.fn()
}));
vi.mock("./identity-runtime", () => ({
  getIdentityEnvironment: () => ({
    allowedRedirectOrigins: ["https://dashboard.test"]
  }),
  resolveDashboardIdentity
}));
import { readTrustedSettingsAuthContext } from "./settings-auth-context";

const context: TrustedSettingsAuthorizationContext = {
  auditActor: {
    actorId: "user-test",
    actorType: "admin",
    displayName: "Admin"
  },
  authenticationMethod: "Passkey",
  expiresAt: "2026-01-01T01:00:00.000Z",
  issuedAt: "2026-01-01T00:00:00.000Z",
  permissions: ["settings:read", "settings:publish"],
  permittedCardIds: [],
  provider: "workos",
  role: "tenant_admin",
  sessionId: "session-test",
  tenantId: "tenant-a",
  userId: "user-test"
};

afterEach(() => {
  resolveDashboardIdentity.mockReset();
});

describe("settings auth context", () => {
  it("derives tenant, role, cards, and permissions only from server identity context", async () => {
    resolveDashboardIdentity.mockResolvedValue({
      context,
      ok: true,
      repository: null
    });
    const request = new Request(
      "https://dashboard.test/api/settings/card-customization/ad-garner",
      {
        headers: {
          "x-card-ids": "card-attacker",
          "x-settings-role": "viewer",
          "x-tenant-id": "tenant-attacker"
        }
      }
    );
    const result = await readTrustedSettingsAuthContext({
      request,
      resourceCardId: "ad-garner",
      resourceTenantId: "tenant-a"
    });
    expect(result).toMatchObject({
      context: {
        actorId: "user-test",
        role: "tenant_admin",
        tenantId: "tenant-a"
      },
      ok: true,
      source: "identity_application_session"
    });
  });

  it.each([
    [401, "Application session is required."],
    [403, "Tenant membership is revoked."],
    [503, "Identity configuration is unavailable."]
  ])("preserves identity resolver status %s", async (status, reason) => {
    resolveDashboardIdentity.mockResolvedValue({ ok: false, reason, status });
    expect(
      await readTrustedSettingsAuthContext({
        request: new Request("https://dashboard.test/api/settings/card-customization/ad-garner"),
        resourceCardId: "ad-garner",
        resourceTenantId: "tenant-a"
      })
    ).toEqual({ ok: false, reason, status });
  });

  it("rejects unsafe settings requests without same-origin CSRF evidence", async () => {
    resolveDashboardIdentity.mockResolvedValue({
      context,
      ok: true,
      repository: {
        verifySessionCsrf: vi.fn().mockResolvedValue(false)
      }
    });
    expect(
      await readTrustedSettingsAuthContext({
        request: new Request(
          "https://dashboard.test/api/settings/card-customization/ad-garner",
          { method: "POST" }
        ),
        resourceCardId: "ad-garner",
        resourceTenantId: "tenant-a"
      })
    ).toMatchObject({ ok: false, status: 403 });
  });
});
