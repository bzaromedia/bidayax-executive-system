import { describe, expect, it } from "vitest";
import {
  createSettingsAuthorizationContextFromClaims,
  validateTrustedSettingsAuthClaims
} from "../settings-auth-claims";

describe("trusted settings auth claims", () => {
  it("accepts matching administrator claims", () => {
    const result = validateTrustedSettingsAuthClaims({
      payload: {
        actorId: "admin-1",
        displayName: "Admin",
        role: "administrator",
        tenantId: "tenant-a"
      },
      resourceCardId: "card-a",
      resourceTenantId: "tenant-a"
    });

    expect(result.ok).toBe(true);
  });

  it("rejects cross-tenant claims", () => {
    const result = validateTrustedSettingsAuthClaims({
      payload: {
        actorId: "admin-1",
        displayName: "Admin",
        role: "administrator",
        tenantId: "tenant-b"
      },
      resourceCardId: "card-a",
      resourceTenantId: "tenant-a"
    });

    expect(result).toMatchObject({ ok: false });
  });

  it("rejects executives for unassigned cards", () => {
    const result = validateTrustedSettingsAuthClaims({
      payload: {
        actorId: "exec-1",
        cardIds: ["card-b"],
        displayName: "Executive",
        role: "executive",
        tenantId: "tenant-a"
      },
      resourceCardId: "card-a",
      resourceTenantId: "tenant-a"
    });

    expect(result).toMatchObject({ ok: false });
  });

  it("rejects expired sessions", () => {
    const result = validateTrustedSettingsAuthClaims({
      now: "2026-07-11T00:00:00.000Z",
      payload: {
        actorId: "admin-1",
        displayName: "Admin",
        expiresAt: "2026-07-10T00:00:00.000Z",
        role: "administrator",
        tenantId: "tenant-a"
      },
      resourceTenantId: "tenant-a"
    });

    expect(result).toMatchObject({ ok: false });
  });

  it("creates authorization context from trusted claims", () => {
    const validation = validateTrustedSettingsAuthClaims({
      payload: {
        actorId: "exec-1",
        cardIds: ["card-a"],
        displayName: "Executive",
        role: "executive",
        tenantId: "tenant-a"
      },
      resourceCardId: "card-a",
      resourceTenantId: "tenant-a"
    });

    expect(validation.ok).toBe(true);

    if (validation.ok) {
      expect(
        createSettingsAuthorizationContextFromClaims({
          claims: validation.claims,
          userAgent: "vitest"
        })
      ).toMatchObject({ actorId: "exec-1", role: "executive", tenantId: "tenant-a" });
    }
  });
});
