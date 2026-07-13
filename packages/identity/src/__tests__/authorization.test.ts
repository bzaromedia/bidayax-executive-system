import { describe, expect, it } from "vitest";
import {
  IdentityAuthorizationError,
  requireIdentityPermission,
  resolveTrustedSettingsAuthorizationContext,
  rolePermissionPolicy
} from "../authorization";
import type {
  CardAccessGrant,
  TenantMembership,
  UserIdentity
} from "@bidayax/types";

const identity: UserIdentity = {
  createdAt: "2026-01-01T00:00:00.000Z",
  displayName: "Executive User",
  email: "user@example.test",
  emailVerified: true,
  lastAuthenticatedAt: "2026-01-01T00:00:00.000Z",
  normalizedEmail: "user@example.test",
  provider: "workos",
  providerSubject: "provider-user",
  status: "active",
  updatedAt: "2026-01-01T00:00:00.000Z",
  userId: "user-test"
};

const membership: TenantMembership = {
  createdAt: "2026-01-01T00:00:00.000Z",
  membershipId: "membership-test",
  role: "settings_editor",
  status: "active",
  tenantId: "tenant-test",
  updatedAt: "2026-01-01T00:00:00.000Z",
  userId: identity.userId
};

const grant: CardAccessGrant = {
  cardId: "card-test",
  createdAt: "2026-01-01T00:00:00.000Z",
  grantId: "grant-test",
  permissionSet: ["settings:publish"],
  tenantId: membership.tenantId,
  userId: identity.userId
};

describe("internal identity authorization", () => {
  it("combines deny-by-default role policy with active card grants", () => {
    const context = resolveTrustedSettingsAuthorizationContext({
      authenticationMethod: "Passkey",
      expiresAt: "2026-01-01T02:00:00.000Z",
      grants: [grant],
      identity,
      issuedAt: "2026-01-01T00:30:00.000Z",
      membership,
      provider: "workos",
      sessionId: "session-test"
    });
    expect(context.permissions).toContain("settings:publish");
    expect(context.permittedCardIds).toEqual(["card-test"]);
    expect(() =>
      requireIdentityPermission(context, "settings:publish", "card-test")
    ).not.toThrow();
  });

  it("denies cards without a valid grant", () => {
    const context = resolveTrustedSettingsAuthorizationContext({
      authenticationMethod: "Passkey",
      expiresAt: "2026-01-01T02:00:00.000Z",
      grants: [grant],
      identity,
      issuedAt: "2026-01-01T00:30:00.000Z",
      membership,
      provider: "workos",
      sessionId: "session-test"
    });
    expect(() =>
      requireIdentityPermission(context, "settings:read", "card-other")
    ).toThrowError(IdentityAuthorizationError);
  });

  it("rejects disabled identities and revoked memberships", () => {
    expect(() =>
      resolveTrustedSettingsAuthorizationContext({
        authenticationMethod: "Password",
        expiresAt: "2026-01-01T02:00:00.000Z",
        grants: [],
        identity: { ...identity, status: "disabled" },
        issuedAt: "2026-01-01T00:30:00.000Z",
        membership,
        provider: "workos",
        sessionId: "session-test"
      })
    ).toThrowError(IdentityAuthorizationError);
    expect(() =>
      resolveTrustedSettingsAuthorizationContext({
        authenticationMethod: "Password",
        expiresAt: "2026-01-01T02:00:00.000Z",
        grants: [],
        identity,
        issuedAt: "2026-01-01T00:30:00.000Z",
        membership: {
          ...membership,
          revokedAt: "2026-01-01T00:15:00.000Z",
          status: "revoked"
        },
        provider: "workos",
        sessionId: "session-test"
      })
    ).toThrowError(IdentityAuthorizationError);
  });

  it("defines every required role with explicit permissions", () => {
    expect(Object.keys(rolePermissionPolicy).sort()).toEqual([
      "executive",
      "receptionist_manager",
      "settings_editor",
      "tenant_admin",
      "tenant_owner",
      "viewer"
    ]);
  });
});
