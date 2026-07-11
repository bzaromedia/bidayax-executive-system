import { describe, expect, it } from "vitest";
import {
  authorizeSettingsAction,
  requireSettingsAuthorization,
  SettingsAuthorizationError,
  type SettingsAuthorizationContext
} from "../settings-authorization";

const administrator: SettingsAuthorizationContext = {
  actorId: "admin-1",
  displayName: "Admin User",
  role: "administrator",
  tenantId: "tenant-a"
};

const executive: SettingsAuthorizationContext = {
  actorId: "exec-1",
  cardIds: ["card-a"],
  displayName: "Executive User",
  role: "executive",
  tenantId: "tenant-a"
};

describe("settings authorization", () => {
  it("allows administrators to publish tenant-owned settings", () => {
    const decision = authorizeSettingsAction({
      context: administrator,
      permission: "settings:publish",
      resource: { cardId: "card-a", tenantId: "tenant-a" }
    });

    expect(decision.allowed).toBe(true);
    expect(decision.auditActor.actorType).toBe("admin");
  });

  it("denies cross-tenant reads even when a card id is known", () => {
    const decision = authorizeSettingsAction({
      context: administrator,
      permission: "settings:read",
      resource: { cardId: "card-b", tenantId: "tenant-b" }
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("tenant");
  });

  it("denies executive publish permission", () => {
    const decision = authorizeSettingsAction({
      context: executive,
      permission: "settings:publish",
      resource: { cardId: "card-a", tenantId: "tenant-a" }
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("executive");
  });

  it("denies executives from unassigned cards", () => {
    expect(() =>
      requireSettingsAuthorization({
        context: executive,
        permission: "settings:update",
        resource: { cardId: "card-b", tenantId: "tenant-a" }
      })
    ).toThrow(SettingsAuthorizationError);
  });
});
