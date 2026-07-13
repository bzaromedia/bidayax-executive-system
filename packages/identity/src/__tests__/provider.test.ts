import { createHmac } from "node:crypto";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  createWorkosProviderAdapter,
  IdentityProviderError,
  validateCallbackNonce,
  verifyProviderAccessToken
} from "../provider";
import type { IdentityEnvironment } from "../environment";
import { sha256 } from "../crypto";

const secret = new TextEncoder().encode("identity-test-secret-32-characters");
const now = Math.floor(Date.now() / 1000);

const environment: IdentityEnvironment = {
  absoluteTimeoutSeconds: 3600,
  allowedAudience: "client_test",
  allowedRedirectOrigins: ["https://dashboard.example.test"],
  applicationBaseUrl: "https://dashboard.example.test",
  callbackUrl: "https://dashboard.example.test/auth/callback",
  clockSkewSeconds: 30,
  cookieSecure: true,
  developmentMode: false,
  idleTimeoutSeconds: 900,
  transactionEncryptionKey: "transaction-encryption-test-key",
  workosApiKey: "redacted-workos-api-key",
  workosClientId: "client_test",
  workosIssuer: "https://api.workos.com/",
  workosJwksUrl: "https://api.workos.com/sso/jwks/client_test",
  workosWebhookSecret: "redacted-workos-webhook-secret"
};

async function token(input: {
  readonly audience?: string;
  readonly expiresAt?: number;
  readonly includeExpiration?: boolean;
  readonly issuedAt?: number;
  readonly issuer?: string;
  readonly notBefore?: number;
  readonly signingSecret?: Uint8Array;
}) {
  let jwt = new SignJWT({ sid: "session_provider" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user_provider")
    .setIssuer(input.issuer ?? environment.workosIssuer)
    .setAudience(input.audience ?? environment.allowedAudience)
    .setIssuedAt(input.issuedAt ?? now);
  if (input.includeExpiration !== false) {
    jwt = jwt.setExpirationTime(input.expiresAt ?? now + 300);
  }
  if (input.notBefore !== undefined) jwt = jwt.setNotBefore(input.notBefore);
  return jwt.sign(input.signingSecret ?? secret);
}

describe("WorkOS provider security", () => {
  it("creates state-bound PKCE authorization requests", () => {
    const login = createWorkosProviderAdapter(environment, {
      verifyAccessToken: async () => ({ sub: "unused" })
    }).startLogin({
      now: new Date().toISOString(),
      returnTo: "https://dashboard.example.test/settings/card-customization"
    });
    const url = new URL(login.authorizationUrl);
    expect(url.searchParams.get("provider")).toBe("authkit");
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(login.transaction.codeVerifier.length).toBeGreaterThan(40);
  });

  it("accepts a correctly signed token", async () => {
    const claims = await verifyProviderAccessToken(await token({}), secret, {
      algorithms: ["HS256"],
      audience: environment.allowedAudience,
      clockSkewSeconds: 30,
      issuer: environment.workosIssuer
    });
    expect(claims.sub).toBe("user_provider");
  });

  it.each([
    ["wrong issuer", { issuer: "https://wrong.example/" }],
    ["wrong audience", { audience: "wrong-client" }],
    ["expired", { expiresAt: now - 120 }],
    ["not before", { notBefore: now + 300 }]
  ])("rejects %s tokens", async (_label, options) => {
    await expect(
      verifyProviderAccessToken(await token(options), secret, {
        algorithms: ["HS256"],
        audience: environment.allowedAudience,
        clockSkewSeconds: 30,
        issuer: environment.workosIssuer
      })
    ).rejects.toBeDefined();
  });

  it("rejects an invalid signature", async () => {
    const other = new TextEncoder().encode("different-signing-secret-32-chars");
    await expect(
      verifyProviderAccessToken(
        await token({ signingSecret: other }),
        secret,
        {
          algorithms: ["HS256"],
          audience: environment.allowedAudience,
          clockSkewSeconds: 30,
          issuer: environment.workosIssuer
        }
      )
    ).rejects.toBeDefined();
  });

  it("rejects malformed tokens", async () => {
    await expect(
      verifyProviderAccessToken("not.a.valid.jwt", secret, {
        algorithms: ["HS256"],
        audience: environment.allowedAudience,
        clockSkewSeconds: 30,
        issuer: environment.workosIssuer
      })
    ).rejects.toBeDefined();
  });
  it("rejects tokens without required expiration", async () => {
    await expect(
      verifyProviderAccessToken(await token({ includeExpiration: false }), secret, {
        algorithms: ["HS256"],
        audience: environment.allowedAudience,
        clockSkewSeconds: 30,
        issuer: environment.workosIssuer
      })
    ).rejects.toBeDefined();
  });

  it("rejects tokens issued too far in the future", async () => {
    await expect(
      verifyProviderAccessToken(await token({ issuedAt: now + 300 }), secret, {
        algorithms: ["HS256"],
        audience: environment.allowedAudience,
        clockSkewSeconds: 30,
        issuer: environment.workosIssuer
      })
    ).rejects.toBeDefined();
  });

  it("rejects mismatched callback nonces when the provider returns one", () => {
    expect(() =>
      validateCallbackNonce({
        expectedNonceHash: sha256("expected"),
        returnedNonce: "wrong"
      })
    ).toThrowError(IdentityProviderError);
  });

  it("verifies WorkOS webhook signatures and rejects stale requests", () => {
    const adapter = createWorkosProviderAdapter(environment);
    const timestamp = String(Date.now());
    const payload = JSON.stringify({
      created_at: new Date().toISOString(),
      data: { id: "session_provider" },
      event: "session.revoked",
      id: "event_provider"
    });
    const signature = createHmac("sha256", environment.workosWebhookSecret)
      .update(timestamp + "." + payload)
      .digest("hex");
    expect(
      adapter.verifyWebhook({
        payload,
        signature: "t=" + timestamp + ",v1=" + signature
      }).eventId
    ).toBe("event_provider");
    expect(() =>
      adapter.verifyWebhook({
        now: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        payload,
        signature: "t=" + timestamp + ",v1=" + signature
      })
    ).toThrowError(IdentityProviderError);
  });
});
