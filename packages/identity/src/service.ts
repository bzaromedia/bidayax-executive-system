import type {
  IdentityProviderAccount,
  TenantMembership,
  UserIdentity
} from "@bidayax/types";
import { createIdentityAuditEvent } from "./audit";
import {
  deterministicIdentityId,
  randomUrlToken,
  sha256
} from "./crypto";
import type { IdentityEnvironment } from "./environment";
import type {
  IdentityProviderAdapter,
  ProviderIdentity
} from "./provider";
import type { IdentityRepository } from "./repository";
import {
  createStoredOAuthTransaction,
  issueApplicationSession,
  readStoredCodeVerifier,
  type IssuedApplicationSession
} from "./session";

export class IdentityServiceError extends Error {
  readonly code:
    | "callback_invalid"
    | "email_unverified"
    | "identity_disabled"
    | "membership_missing"
    | "membership_ambiguous"
    | "webhook_replayed";

  constructor(code: IdentityServiceError["code"], message: string) {
    super(message);
    this.name = "IdentityServiceError";
    this.code = code;
  }
}

function chooseMembership(
  memberships: readonly TenantMembership[],
  linkedTenantId: string | null
): TenantMembership {
  if (linkedTenantId) {
    const linked = memberships.find((membership) => membership.tenantId === linkedTenantId);
    if (!linked) {
      throw new IdentityServiceError(
        "membership_missing",
        "No active internal membership matches the provider organization."
      );
    }
    return linked;
  }

  if (memberships.length === 0) {
    throw new IdentityServiceError(
      "membership_missing",
      "An internal tenant membership is required."
    );
  }

  if (memberships.length !== 1) {
    throw new IdentityServiceError(
      "membership_ambiguous",
      "Tenant selection is required for users with multiple memberships."
    );
  }

  return memberships[0] as TenantMembership;
}

async function resolveProviderTenant(
  repository: IdentityRepository,
  identity: ProviderIdentity
): Promise<string | null> {
  return identity.providerTenantId
    ? repository.getTenantIdForProviderTenant(identity.providerTenantId)
    : null;
}

async function persistProviderIdentity(input: {
  readonly identity: ProviderIdentity;
  readonly now: string;
  readonly repository: IdentityRepository;
}): Promise<UserIdentity> {
  if (!input.identity.emailVerified) {
    throw new IdentityServiceError(
      "email_unverified",
      "Verified email is required for settings access."
    );
  }

  const user = await input.repository.upsertProviderIdentity(input.identity, input.now);
  if (user.status !== "active") {
    throw new IdentityServiceError(
      "identity_disabled",
      "The internal identity is disabled."
    );
  }

  const account: IdentityProviderAccount = {
    createdAt: input.now,
    provider: "workos",
    providerAccountId:
      "pacc_" + deterministicIdentityId("workos", input.identity.providerSubject).slice(0, 32),
    providerMetadata: {
      authenticationMethod: input.identity.authenticationMethod
    },
    providerSubject: input.identity.providerSubject,
    providerTenantId: input.identity.providerTenantId ?? null,
    updatedAt: input.now,
    userId: user.userId
  };
  await input.repository.saveProviderAccount(account);
  return user;
}

export async function startIdentityLogin(input: {
  readonly environment: IdentityEnvironment;
  readonly now?: string;
  readonly provider: IdentityProviderAdapter;
  readonly repository: IdentityRepository;
  readonly returnTo: string;
}): Promise<{
  readonly authorizationUrl: string;
  readonly transactionToken: string;
}> {
  const now = input.now ?? new Date().toISOString();
  const login = input.provider.startLogin({ now, returnTo: input.returnTo });
  const transactionToken = randomUrlToken(40);
  await input.repository.saveOAuthTransaction(
    createStoredOAuthTransaction({
      codeVerifier: login.transaction.codeVerifier,
      createdAt: login.transaction.createdAt,
      encryptionKey: input.environment.transactionEncryptionKey,
      expiresAt: login.transaction.expiresAt,
      nonceHash: login.transaction.nonceHash,
      returnTo: login.transaction.returnTo,
      stateHash: login.transaction.stateHash,
      transactionId: login.transaction.transactionId,
      transactionToken
    })
  );
  await input.repository.saveAuditEvent(
    createIdentityAuditEvent({
      eventType: "identity.login.started",
      occurredAt: now,
      reasonCode: "LOGIN_INITIATED",
      result: "succeeded"
    })
  );

  return {
    authorizationUrl: login.authorizationUrl,
    transactionToken
  };
}

export async function completeIdentityLogin(input: {
  readonly code: string;
  readonly environment: IdentityEnvironment;
  readonly ipAddress?: string | undefined;
  readonly now?: string;
  readonly provider: IdentityProviderAdapter;
  readonly repository: IdentityRepository;
  readonly returnedNonce?: string | null;
  readonly state: string;
  readonly transactionToken: string;
  readonly userAgent?: string | undefined;
}): Promise<{
  readonly issued: IssuedApplicationSession;
  readonly returnTo: string;
}> {
  const now = input.now ?? new Date().toISOString();
  const transaction = await input.repository.consumeOAuthTransaction(
    sha256(input.transactionToken),
    sha256(input.state),
    now
  );
  if (!transaction) {
    throw new IdentityServiceError(
      "callback_invalid",
      "Login transaction is missing, expired, mismatched, or already consumed."
    );
  }

  const providerResult = await input.provider.completeCallback({
    code: input.code,
    codeVerifier: readStoredCodeVerifier(
      transaction,
      input.environment.transactionEncryptionKey
    ),
    expectedNonceHash: transaction.nonceHash,
    ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
    ...(input.returnedNonce !== undefined
      ? { returnedNonce: input.returnedNonce }
      : {}),
    ...(input.userAgent ? { userAgent: input.userAgent } : {})
  });
  const user = await persistProviderIdentity({
    identity: providerResult.identity,
    now,
    repository: input.repository
  });
  const memberships = await input.repository.listActiveMemberships(user.userId);
  const linkedTenantId = await resolveProviderTenant(
    input.repository,
    providerResult.identity
  );
  const membership = chooseMembership(memberships, linkedTenantId);
  const issued = await issueApplicationSession({
    authenticationMethod: providerResult.identity.authenticationMethod,
    environment: input.environment,
    now,
    ...(providerResult.identity.providerSessionId !== undefined
      ? { providerSessionId: providerResult.identity.providerSessionId }
      : {}),
    repository: input.repository,
    tenantId: membership.tenantId,
    userId: user.userId
  });

  for (const event of [
    createIdentityAuditEvent({
      eventType: "identity.login.succeeded",
      occurredAt: now,
      reasonCode: "LOGIN_VERIFIED",
      result: "succeeded",
      sessionId: issued.session.sessionId,
      tenantId: membership.tenantId,
      userId: user.userId
    }),
    createIdentityAuditEvent({
      eventType: "identity.session.created",
      occurredAt: now,
      reasonCode: "APPLICATION_SESSION_CREATED",
      result: "succeeded",
      sessionId: issued.session.sessionId,
      tenantId: membership.tenantId,
      userId: user.userId
    })
  ]) {
    await input.repository.saveAuditEvent(event);
  }

  return { issued, returnTo: transaction.returnTo };
}

export async function rotateApplicationSession(input: {
  readonly environment: IdentityEnvironment;
  readonly now?: string;
  readonly repository: IdentityRepository;
  readonly session: {
    readonly authenticationMethod: string;
    readonly providerSessionId?: string | null;
    readonly sessionId: string;
    readonly tenantId: string;
    readonly userId: string;
  };
}): Promise<IssuedApplicationSession> {
  const now = input.now ?? new Date().toISOString();
  const issued = await issueApplicationSession({
    authenticationMethod: input.session.authenticationMethod,
    environment: input.environment,
    now,
    ...(input.session.providerSessionId !== undefined
      ? { providerSessionId: input.session.providerSessionId }
      : {}),
    repository: input.repository,
    rotatedFromSessionId: input.session.sessionId,
    tenantId: input.session.tenantId,
    userId: input.session.userId
  });
  await input.repository.revokeSession(input.session.sessionId, now);
  await input.repository.saveAuditEvent(
    createIdentityAuditEvent({
      eventType: "identity.session.refreshed",
      occurredAt: now,
      reasonCode: "SESSION_ROTATED",
      result: "succeeded",
      sessionId: issued.session.sessionId,
      tenantId: issued.session.tenantId,
      userId: issued.session.userId
    })
  );
  return issued;
}

export async function revokeApplicationSession(input: {
  readonly now?: string;
  readonly repository: IdentityRepository;
  readonly sessionId: string;
  readonly tenantId: string;
  readonly userId: string;
}): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  await input.repository.revokeSession(input.sessionId, now);
  await input.repository.saveAuditEvent(
    createIdentityAuditEvent({
      eventType: "identity.logout",
      occurredAt: now,
      reasonCode: "USER_LOGOUT",
      result: "succeeded",
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId
    })
  );
}

function providerSubjectFromWebhook(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  return typeof record.id === "string"
    ? record.id
    : typeof record.user_id === "string"
      ? record.user_id
      : null;
}

function providerSessionFromWebhook(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  return typeof record.id === "string" && record.id.startsWith("session_")
    ? record.id
    : typeof record.session_id === "string"
      ? record.session_id
      : null;
}

export async function processIdentityWebhook(input: {
  readonly now?: string;
  readonly payload: string;
  readonly provider: IdentityProviderAdapter;
  readonly repository: IdentityRepository;
  readonly signature: string;
}): Promise<{ readonly duplicate: boolean; readonly eventType: string }> {
  const now = input.now ?? new Date().toISOString();
  const event = input.provider.verifyWebhook({
    now,
    payload: input.payload,
    signature: input.signature
  });
  const saved = await input.repository.saveWebhookReceipt(event, sha256(input.payload), now);
  if (!saved) {
    return { duplicate: true, eventType: event.eventType };
  }

  if (event.eventType === "session.revoked") {
    const providerSessionId = providerSessionFromWebhook(event.data);
    if (providerSessionId) {
      await input.repository.revokeSessionsByProviderSession(providerSessionId, now);
    }
  }

  if (event.eventType === "user.deleted") {
    const subject = providerSubjectFromWebhook(event.data);
    if (subject) {
      const userId = await input.repository.disableIdentityByProviderSubject(subject, now);
      if (userId) {
        await input.repository.saveAuditEvent(
          createIdentityAuditEvent({
            eventType: "identity.account.disabled",
            occurredAt: now,
            reasonCode: "PROVIDER_USER_DELETED",
            result: "succeeded",
            userId
          })
        );
      }
    }
  }

  await input.repository.saveAuditEvent(
    createIdentityAuditEvent({
      eventType: "identity.provider_webhook.received",
      metadata: { providerEventId: event.eventId, providerEventType: event.eventType },
      occurredAt: now,
      reasonCode: "WEBHOOK_VERIFIED",
      result: "succeeded"
    })
  );

  return { duplicate: false, eventType: event.eventType };
}
