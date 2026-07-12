import { describe, expect, it } from "vitest";
import type {
  ApplicationSession,
  CardAccessGrant,
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
import type {
  IdentityProviderAdapter,
  ProviderIdentity,
  VerifiedProviderWebhook
} from "../provider";
import type { IdentityEnvironment } from "../environment";
import {
  completeIdentityLogin,
  IdentityServiceError,
  processIdentityWebhook,
  startIdentityLogin
} from "../service";
import { createStoredOAuthTransaction } from "../session";
import { randomUrlToken, sha256 } from "../crypto";

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

function fixture(options: {
  readonly emailVerified?: boolean;
  readonly memberships?: readonly TenantMembership[];
} = {}) {
  let transaction: StoredOAuthTransaction | null = null;
  let consumed = false;
  let webhookSaved = false;
  const audit: IdentityAuditEvent[] = [];
  const user: UserIdentity = {
    createdAt: "2026-01-01T00:00:00.000Z",
    displayName: "Test User",
    email: "user@example.test",
    emailVerified: options.emailVerified ?? true,
    lastAuthenticatedAt: "2026-01-01T00:00:00.000Z",
    normalizedEmail: "user@example.test",
    provider: "workos",
    providerSubject: "provider-user",
    status: "active",
    updatedAt: "2026-01-01T00:00:00.000Z",
    userId: "usr_provider-user"
  };
  const memberships = options.memberships ?? [{
    createdAt: "2026-01-01T00:00:00.000Z",
    membershipId: "membership-test",
    role: "tenant_admin",
    status: "active",
    tenantId: "tenant-test",
    updatedAt: "2026-01-01T00:00:00.000Z",
    userId: user.userId
  }];
  const providerIdentity: ProviderIdentity = {
    authenticationMethod: "Passkey",
    displayName: user.displayName,
    email: user.email,
    emailVerified: options.emailVerified ?? true,
    provider: "workos",
    providerSessionId: "session-provider",
    providerSubject: user.providerSubject
  };
  const provider: IdentityProviderAdapter = {
    async completeCallback() {
      return { accessTokenClaims: { sub: user.providerSubject }, identity: providerIdentity };
    },
    getLogoutUrl() { return "https://api.workos.com/logout"; },
    provider: "workos",
    async revokeProviderSession() {},
    startLogin({ now = new Date().toISOString(), returnTo }) {
      return {
        authorizationUrl: "https://api.workos.com/authorize?state=state-test",
        transaction: {
          codeVerifier: "verifier-test",
          createdAt: now,
          expiresAt: new Date(Date.parse(now) + 600_000).toISOString(),
          nonceHash: sha256("nonce-test"),
          returnTo,
          stateHash: sha256("state-test"),
          transactionId: "transaction-test"
        }
      };
    },
    verifyWebhook() {
      return {
        data: { id: "session-provider" },
        eventId: "event-test",
        eventType: "session.revoked",
        occurredAt: "2026-01-01T00:00:00.000Z"
      };
    }
  };
  const repository: IdentityRepository = {
    async consumeOAuthTransaction(tokenHash, stateHash, now) {
      if (
        !transaction ||
        consumed ||
        transaction.transactionTokenHash !== tokenHash ||
        transaction.stateHash !== stateHash
      ) return null;
      consumed = true;
      return { ...transaction, consumedAt: now };
    },
    async createSession(session: StoredApplicationSession): Promise<ApplicationSession> {
      return session;
    },
    async disableIdentityByProviderSubject() { return null; },
    async getIdentity() { return user; },
    async getSessionByTokenHash() { return null; },
    async getTenantIdForProviderTenant() { return null; },
    async listActiveCardGrants(): Promise<readonly CardAccessGrant[]> { return []; },
    async listActiveMemberships() { return memberships; },
    async revokeSession() { return true; },
    async revokeSessionsByProviderSession() { return 1; },
    async saveAuditEvent(event) { audit.push(event); },
    async saveOAuthTransaction(value) { transaction = value; },
    async saveProviderAccount(account: IdentityProviderAccount) { return account; },
    async saveWebhookReceipt(_webhook: VerifiedProviderWebhook) {
      if (webhookSaved) return false;
      webhookSaved = true;
      return true;
    },
    async touchSession() { return true; },
    async upsertProviderIdentity() { return user; },
    async verifySessionCsrf() { return true; }
  };
  return { audit, provider, repository };
}

describe("identity service vertical slice", () => {
  it("completes login into an internal tenant-scoped application session", async () => {
    const test = fixture();
    const started = await startIdentityLogin({
      environment,
      now: "2026-01-01T00:00:00.000Z",
      provider: test.provider,
      repository: test.repository,
      returnTo: "https://dashboard.example.test/settings/card-customization"
    });
    const completed = await completeIdentityLogin({
      code: "code-test",
      environment,
      now: "2026-01-01T00:01:00.000Z",
      provider: test.provider,
      repository: test.repository,
      state: "state-test",
      transactionToken: started.transactionToken
    });
    expect(completed.issued.session.tenantId).toBe("tenant-test");
    expect(test.audit.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "identity.login.started",
        "identity.login.succeeded",
        "identity.session.created"
      ])
    );
  });

  it("rejects missing, mismatched, and replayed state", async () => {
    const test = fixture();
    const started = await startIdentityLogin({
      environment,
      provider: test.provider,
      repository: test.repository,
      returnTo: "https://dashboard.example.test/settings/card-customization"
    });
    await expect(
      completeIdentityLogin({
        code: "code-test",
        environment,
        provider: test.provider,
        repository: test.repository,
        state: "wrong-state",
        transactionToken: started.transactionToken
      })
    ).rejects.toBeInstanceOf(IdentityServiceError);
    await completeIdentityLogin({
      code: "code-test",
      environment,
      provider: test.provider,
      repository: test.repository,
      state: "state-test",
      transactionToken: started.transactionToken
    });
    await expect(
      completeIdentityLogin({
        code: "code-test",
        environment,
        provider: test.provider,
        repository: test.repository,
        state: "state-test",
        transactionToken: started.transactionToken
      })
    ).rejects.toBeInstanceOf(IdentityServiceError);
  });

  it("rejects unverified email and missing membership", async () => {
    for (const test of [
      fixture({ emailVerified: false }),
      fixture({ memberships: [] })
    ]) {
      const transactionToken = randomUrlToken(40);
      await test.repository.saveOAuthTransaction(
        createStoredOAuthTransaction({
          codeVerifier: "verifier-test",
          createdAt: "2026-01-01T00:00:00.000Z",
          encryptionKey: environment.transactionEncryptionKey,
          expiresAt: "2026-01-01T00:10:00.000Z",
          nonceHash: sha256("nonce-test"),
          returnTo: "https://dashboard.example.test/settings/card-customization",
          stateHash: sha256("state-test"),
          transactionId: "transaction-test",
          transactionToken
        })
      );
      await expect(
        completeIdentityLogin({
          code: "code-test",
          environment,
          now: "2026-01-01T00:01:00.000Z",
          provider: test.provider,
          repository: test.repository,
          state: "state-test",
          transactionToken
        })
      ).rejects.toBeInstanceOf(IdentityServiceError);
    }
  });

  it("deduplicates replayed provider webhooks", async () => {
    const test = fixture();
    expect(
      await processIdentityWebhook({
        payload: "{}",
        provider: test.provider,
        repository: test.repository,
        signature: "verified"
      })
    ).toEqual({ duplicate: false, eventType: "session.revoked" });
    expect(
      await processIdentityWebhook({
        payload: "{}",
        provider: test.provider,
        repository: test.repository,
        signature: "verified"
      })
    ).toEqual({ duplicate: true, eventType: "session.revoked" });
  });
});
