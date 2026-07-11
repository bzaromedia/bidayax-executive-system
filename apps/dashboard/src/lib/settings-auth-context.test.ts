import { afterEach, describe, expect, it } from "vitest";
import {
  createTrustedSettingsAuthToken,
  readTrustedSettingsAuthContext,
  settingsSessionCookieName
} from "./settings-auth-context";

const originalSecret = process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET;
afterEach(() => {
  process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET = originalSecret;
});

describe("settings auth context", () => {
  it("derives tenant and role from signed session claims instead of override headers", () => {
    process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET = "test-secret";
    const token = createTrustedSettingsAuthToken({
      claims: {
        actorId: "admin-1",
        displayName: "Admin",
        role: "administrator",
        tenantId: "tenant-a"
      },
      secret: "test-secret"
    });
    const request = new Request("https://dashboard.test/api/settings/card-customization/ad-garner", {
      headers: {
        cookie: `${settingsSessionCookieName}=${token}`,
        "x-card-ids": "card-b",
        "x-settings-role": "viewer",
        "x-tenant-id": "tenant-b"
      }
    });

    const result = readTrustedSettingsAuthContext({
      request,
      resourceCardId: "ad-garner",
      resourceTenantId: "tenant-a"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.context.tenantId).toBe("tenant-a");
      expect(result.context.role).toBe("administrator");
    }
  });

  it("rejects missing trusted tokens when a secret is configured", () => {
    process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET = "test-secret";

    const result = readTrustedSettingsAuthContext({
      request: new Request("https://dashboard.test/api/settings/card-customization/ad-garner"),
      resourceCardId: "ad-garner",
      resourceTenantId: "tenant-a"
    });

    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects signed claims for a different tenant", () => {
    process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET = "test-secret";
    const token = createTrustedSettingsAuthToken({
      claims: {
        actorId: "admin-1",
        displayName: "Admin",
        role: "administrator",
        tenantId: "tenant-b"
      },
      secret: "test-secret"
    });

    const result = readTrustedSettingsAuthContext({
      request: new Request("https://dashboard.test/api/settings/card-customization/ad-garner", {
        headers: {
          authorization: `Bearer ${token}`
        }
      }),
      resourceCardId: "ad-garner",
      resourceTenantId: "tenant-a"
    });

    expect(result).toMatchObject({ ok: false, status: 403 });
  });
});
