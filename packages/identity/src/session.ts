import type {
  ApplicationSession,
  TrustedSettingsAuthorizationContext
} from "@bidayax/types";
import { resolveTrustedSettingsAuthorizationContext } from "./authorization";
import {
  randomUrlToken,
  sealSecret,
  sha256,
  unsealSecret
} from "./crypto";
import type { IdentityEnvironment } from "./environment";
import type {
  IdentityRepository,
  StoredApplicationSession,
  StoredOAuthTransaction
} from "./repository";

export const applicationSessionCookieName = "bidayax_identity_session";
export const identityCsrfCookieName = "bidayax_identity_csrf";
export const identityTransactionCookieName = "bidayax_identity_transaction";

export type IssuedApplicationSession = {
  readonly csrfToken: string;
  readonly session: ApplicationSession;
  readonly sessionToken: string;
};

export type SessionResolution =
  | {
      readonly ok: true;
      readonly context: TrustedSettingsAuthorizationContext;
      readonly session: ApplicationSession;
    }
  | {
      readonly ok: false;
      readonly code:
        | "missing_session"
        | "invalid_session"
        | "expired_session"
        | "disabled_identity"
        | "revoked_membership"
        | "ambiguous_membership";
      readonly reason: string;
    };

export function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const entry of header.split(";")) {
    const [cookieName, ...parts] = entry.trim().split("=");
    if (cookieName === name) return decodeURIComponent(parts.join("="));
  }
  return null;
}

export function serializeIdentityCookie(input: {
  readonly domain?: string | undefined;
  readonly httpOnly: boolean;
  readonly maxAge: number;
  readonly name: string;
  readonly secure: boolean;
  readonly value: string;
}): string {
  return [
    input.name + "=" + encodeURIComponent(input.value),
    "Path=/",
    "Max-Age=" + Math.max(0, Math.floor(input.maxAge)),
    input.httpOnly ? "HttpOnly" : null,
    "SameSite=Lax",
    input.secure ? "Secure" : null,
    input.domain ? "Domain=" + input.domain : null
  ].filter(Boolean).join("; ");
}

export function clearIdentityCookie(input: {
  readonly domain?: string | undefined;
  readonly httpOnly: boolean;
  readonly name: string;
  readonly secure: boolean;
}): string {
  return serializeIdentityCookie({
    ...input,
    maxAge: 0,
    value: ""
  });
}

export function createStoredOAuthTransaction(input: {
  readonly codeVerifier: string;
  readonly createdAt: string;
  readonly encryptionKey: string;
  readonly expiresAt: string;
  readonly nonceHash: string;
  readonly returnTo: string;
  readonly stateHash: string;
  readonly transactionId: string;
  readonly transactionToken: string;
}): StoredOAuthTransaction {
  return {
    codeVerifier: "",
    codeVerifierCiphertext: sealSecret(input.codeVerifier, input.encryptionKey),
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    nonceHash: input.nonceHash,
    returnTo: input.returnTo,
    stateHash: input.stateHash,
    transactionId: input.transactionId,
    transactionTokenHash: sha256(input.transactionToken)
  };
}

export function readStoredCodeVerifier(
  transaction: StoredOAuthTransaction,
  encryptionKey: string
): string {
  return unsealSecret(transaction.codeVerifierCiphertext, encryptionKey);
}

export async function issueApplicationSession(input: {
  readonly authenticationMethod: string;
  readonly environment: IdentityEnvironment;
  readonly now?: string;
  readonly providerSessionId?: string | null;
  readonly repository: IdentityRepository;
  readonly rotatedFromSessionId?: string | null;
  readonly tenantId: string;
  readonly userId: string;
}): Promise<IssuedApplicationSession> {
  const now = input.now ?? new Date().toISOString();
  const createdAt = new Date(now);
  const sessionToken = randomUrlToken(48);
  const csrfToken = randomUrlToken(32);
  const sessionId = "ses_" + randomUrlToken(24);
  const idleExpiresAt = new Date(
    createdAt.getTime() + input.environment.idleTimeoutSeconds * 1000
  ).toISOString();
  const absoluteExpiresAt = new Date(
    createdAt.getTime() + input.environment.absoluteTimeoutSeconds * 1000
  ).toISOString();

  const stored: StoredApplicationSession = {
    absoluteExpiresAt,
    authenticationMethod: input.authenticationMethod,
    createdAt: now,
    csrfTokenHash: sha256(csrfToken),
    idleExpiresAt,
    lastSeenAt: now,
    provider: "workos",
    providerSessionId: input.providerSessionId ?? null,
    revokedAt: null,
    rotatedFromSessionId: input.rotatedFromSessionId ?? null,
    sessionId,
    sessionTokenHash: sha256(sessionToken),
    tenantId: input.tenantId,
    userId: input.userId
  };

  const session = await input.repository.createSession(stored);
  return { csrfToken, session, sessionToken };
}

function selectMembership(
  memberships: Awaited<ReturnType<IdentityRepository["listActiveMemberships"]>>,
  tenantId?: string | null
) {
  if (tenantId) return memberships.find((entry) => entry.tenantId === tenantId) ?? null;
  return memberships.length === 1 ? memberships[0] ?? null : null;
}

export async function resolveApplicationSession(input: {
  readonly environment: IdentityEnvironment;
  readonly now?: string;
  readonly repository: IdentityRepository;
  readonly sessionToken: string | null;
}): Promise<SessionResolution> {
  if (!input.sessionToken) {
    return { code: "missing_session", ok: false, reason: "Application session is required." };
  }

  const session = await input.repository.getSessionByTokenHash(sha256(input.sessionToken));
  if (!session || session.revokedAt) {
    return { code: "invalid_session", ok: false, reason: "Application session is invalid." };
  }

  const now = input.now ?? new Date().toISOString();
  const timestamp = Date.parse(now);
  if (
    Date.parse(session.idleExpiresAt) <= timestamp ||
    Date.parse(session.absoluteExpiresAt) <= timestamp
  ) {
    await input.repository.revokeSession(session.sessionId, now);
    return { code: "expired_session", ok: false, reason: "Application session expired." };
  }

  const identity = await input.repository.getIdentity(session.userId);
  if (!identity || identity.status !== "active") {
    return {
      code: "disabled_identity",
      ok: false,
      reason: "Authenticated identity is unavailable or disabled."
    };
  }

  const memberships = await input.repository.listActiveMemberships(identity.userId);
  const membership = selectMembership(memberships, session.tenantId);
  if (!membership) {
    return {
      code: memberships.length > 1 ? "ambiguous_membership" : "revoked_membership",
      ok: false,
      reason: "An active tenant membership is required."
    };
  }

  const grants = await input.repository.listActiveCardGrants(
    identity.userId,
    membership.tenantId,
    now
  );
  const idleExpiresAt = new Date(
    Math.min(
      timestamp + input.environment.idleTimeoutSeconds * 1000,
      Date.parse(session.absoluteExpiresAt)
    )
  ).toISOString();
  await input.repository.touchSession(session.sessionId, now, idleExpiresAt);

  return {
    context: resolveTrustedSettingsAuthorizationContext({
      authenticationMethod: session.authenticationMethod,
      expiresAt: session.absoluteExpiresAt,
      grants,
      identity,
      issuedAt: session.createdAt,
      membership,
      provider: "workos",
      sessionId: session.sessionId
    }),
    ok: true,
    session: { ...session, idleExpiresAt, lastSeenAt: now }
  };
}

export async function verifyCsrf(input: {
  readonly csrfCookie: string | null;
  readonly csrfHeader: string | null;
  readonly repository: IdentityRepository;
  readonly sessionId: string;
}): Promise<boolean> {
  if (!input.csrfCookie || !input.csrfHeader || input.csrfCookie !== input.csrfHeader) {
    return false;
  }
  return input.repository.verifySessionCsrf(input.sessionId, sha256(input.csrfCookie));
}
