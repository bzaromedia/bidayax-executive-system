import { describe, expect, it } from "vitest";
import type {
  IdentityAuditEvent,
  IdentityProviderAccount,
  TenantMembership,
  UserIdentity
} from "@bidayax/types";
import type {
  IdentityRepository,
  StoredApplicationSession,
  StoredOAuthTransaction
} from "../repository";
import type { VerifiedProviderWebhook } from "../provider";
import type { IdentityEnvironment } from "../environment";
import {
  issueApplicationSession,
  resolveApplicationSession,
  verifyCsrf
} from "../session";
import { sha256 } from "../crypto";

const environment: IdentityEnvironment = {
  absoluteTimeoutSeconds: 3600,
  allowedAudience: "client",
  allowedRedirectOrigins: ["https://dashboard.example.test"],
  applicationBaseUrl: "https://dashboard.example.test",
  callbackUrl: "https://dashboard.example.test/auth/callback",
  clockSkewSeconds: 30,
  cookieSecure: true,
  developmentMode: false,
  idleTimeoutSeconds: 900,
  transactionEncryptionKey: "encryption-key",
  workosApiKey: "redacted",
  workosClientId: "client",
  workosIssuer: "https://api.workos.com/",
  workosJwksUrl: "https://example.test/jwks",
  workosWebhookSecret: "redacted"
};

function repositoryFixture(input: {
  readonly identity?: UserIdentity | null;
  readonly membership?: TenantMembership | null;
  readonly now?: string;
}) {
  let stored: StoredApplicationSession | null = null;
  let revoked = false;
  const identity = input.identity === undefined
    ? {
        createdAt: "2026-01-01T00:00:00.000Z",
        displayName: "Test User",
        email: "user@example.test",
        emailVerified: true,
        lastAuthenticatedAt: "2026-01-01T00:00:00.000Z",
        normalizedEmail: "user@example.test",
        provider: "workos" as const,
        providerSubject: "provider-user",
        status: "active" as const,
        updatedAt: "2026-01-01T00:00:00.000Z",
        userId: "user-test"
      }
    : input.identity;
  const membership = input.membership === undefined
    ? {
        createdAt: "2026-01-01T00:00:00.000Z",
        membershipId: "membership-test",
        role: "tenant_owner" as const,
        status: "active" as const,
        tenantId: "tenant-test",
        updatedAt: "2026-01-01T00:00:00.000Z",
        userId: "user-test"
      }
    : input.membership;

  const repository: IdentityRepository = {
    async consumeOAuthTransaction() { return null; },
    async createSession(session) {
      stored = session;
      return session;
    },
    async disableIdentityByProviderSubject() { return null; },
    async getIdentity() { return identity; },
    async getSessionByTokenHash(hash) {
      return stored?.sessionTokenHash === hash && !revoked ? stored : null;
    },
    async getTenantIdForProviderTenant() { return null; },
    async listActiveCardGrants() { return []; },
    async listActiveMemberships() { return membership ? [membership] : []; },
    async revokeSession() { revoked = true; return true; },
    async revokeSessionsByProviderSession() { return 0; },
    async saveAuditEvent(_event: IdentityAuditEvent) {},
    async saveOAuthTransaction(_transaction: StoredOAuthTransaction) {},
    async saveProviderAccount(account: IdentityProviderAccount) { return account; },
    async saveWebhookReceipt(_webhook: VerifiedProviderWebhook) { return true; },
    async touchSession(_sessionId, lastSeenAt, idleExpiresAt) {
      if (stored) stored = { ...stored, idleExpiresAt, lastSeenAt };
      return true;
    },
    async upsertProviderIdentity() {
      if (!identity) throw new Error("Missing identity");
      return identity;
    },
    async verifySessionCsrf(sessionId, hash) {
      return stored?.sessionId === sessionId && stored.csrfTokenHash === hash;
    }
  };
  return { get revoked() { return revoked; }, get stored() { return stored; }, repository };
}

describe("application sessions", () => {
  it("issues an opaque session and resolves internal authorization", async () => {
    const fixture = repositoryFixture({});
    const issued = await issueApplicationSession({
      authenticationMethod: "Passkey",
      environment,
      now: "2026-01-01T00:00:00.000Z",
      repository: fixture.repository,
      tenantId: "tenant-test",
      userId: "user-test"
    });
    expect(fixture.stored?.sessionTokenHash).toBe(sha256(issued.sessionToken));
    const resolved = await resolveApplicationSession({
      environment,
      now: "2026-01-01T00:05:00.000Z",
      repository: fixture.repository,
      sessionToken: issued.sessionToken
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.context.role).toBe("tenant_owner");
  });

  it("rejects and revokes expired sessions", async () => {
    const fixture = repositoryFixture({});
    const issued = await issueApplicationSession({
      authenticationMethod: "Password",
      environment: { ...environment, idleTimeoutSeconds: 60 },
      now: "2026-01-01T00:00:00.000Z",
      repository: fixture.repository,
      tenantId: "tenant-test",
      userId: "user-test"
    });
    const resolved = await resolveApplicationSession({
      environment,
      now: "2026-01-01T00:02:00.000Z",
      repository: fixture.repository,
      sessionToken: issued.sessionToken
    });
    expect(resolved).toMatchObject({ code: "expired_session", ok: false });
    expect(fixture.revoked).toBe(true);
  });

  it("rejects revoked memberships", async () => {
    const fixture = repositoryFixture({ membership: null });
    const issued = await issueApplicationSession({
      authenticationMethod: "SSO",
      environment,
      now: "2026-01-01T00:00:00.000Z",
      repository: fixture.repository,
      tenantId: "tenant-test",
      userId: "user-test"
    });
    expect(
      await resolveApplicationSession({
        environment,
        now: "2026-01-01T00:05:00.000Z",
        repository: fixture.repository,
        sessionToken: issued.sessionToken
      })
    ).toMatchObject({ code: "revoked_membership", ok: false });
  });

  it("requires matching double-submit CSRF evidence", async () => {
    const fixture = repositoryFixture({});
    const issued = await issueApplicationSession({
      authenticationMethod: "Passkey",
      environment,
      repository: fixture.repository,
      tenantId: "tenant-test",
      userId: "user-test"
    });
    expect(
      await verifyCsrf({
        csrfCookie: issued.csrfToken,
        csrfHeader: issued.csrfToken,
        repository: fixture.repository,
        sessionId: issued.session.sessionId
      })
    ).toBe(true);
    expect(
      await verifyCsrf({
        csrfCookie: issued.csrfToken,
        csrfHeader: "wrong",
        repository: fixture.repository,
        sessionId: issued.session.sessionId
      })
    ).toBe(false);
  });
});
