import type {
  ApplicationSession,
  CardAccessGrant,
  IdentityAuditEvent,
  IdentityPermission,
  IdentityProviderAccount,
  TenantMembership,
  TenantMembershipRole,
  UserIdentity
} from "@bidayax/types";
import type { OAuthTransaction, ProviderIdentity, VerifiedProviderWebhook } from "./provider";

export type IdentityQueryResult<Row> = {
  readonly rows: readonly Row[];
  readonly rowCount?: number | null;
};

export type IdentityQueryExecutor = {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): Promise<IdentityQueryResult<Row>>;
};

export type StoredOAuthTransaction = OAuthTransaction & {
  readonly transactionTokenHash: string;
  readonly codeVerifierCiphertext: string;
};

export type StoredApplicationSession = ApplicationSession & {
  readonly sessionTokenHash: string;
  readonly csrfTokenHash: string;
};

export type IdentityRepository = {
  upsertProviderIdentity(
    identity: ProviderIdentity,
    now: string
  ): Promise<UserIdentity>;
  saveProviderAccount(
    account: IdentityProviderAccount
  ): Promise<IdentityProviderAccount>;
  getIdentity(userId: string): Promise<UserIdentity | null>;
  getTenantIdForProviderTenant(
    providerTenantId: string
  ): Promise<string | null>;
  listActiveMemberships(userId: string): Promise<readonly TenantMembership[]>;
  listActiveCardGrants(
    userId: string,
    tenantId: string,
    now: string
  ): Promise<readonly CardAccessGrant[]>;
  createSession(session: StoredApplicationSession): Promise<ApplicationSession>;
  getSessionByTokenHash(tokenHash: string): Promise<ApplicationSession | null>;
  verifySessionCsrf(sessionId: string, csrfTokenHash: string): Promise<boolean>;
  touchSession(
    sessionId: string,
    lastSeenAt: string,
    idleExpiresAt: string
  ): Promise<boolean>;
  revokeSession(sessionId: string, revokedAt: string): Promise<boolean>;
  revokeSessionsByProviderSession(
    providerSessionId: string,
    revokedAt: string
  ): Promise<number>;
  saveOAuthTransaction(transaction: StoredOAuthTransaction): Promise<void>;
  consumeOAuthTransaction(
    transactionTokenHash: string,
    stateHash: string,
    now: string
  ): Promise<StoredOAuthTransaction | null>;
  saveAuditEvent(event: IdentityAuditEvent): Promise<void>;
  saveWebhookReceipt(
    webhook: VerifiedProviderWebhook,
    payloadHash: string,
    receivedAt: string
  ): Promise<boolean>;
  disableIdentityByProviderSubject(
    providerSubject: string,
    now: string
  ): Promise<string | null>;
};

type UserIdentityRow = {
  readonly user_id: string;
  readonly provider: "workos";
  readonly provider_subject: string;
  readonly email: string;
  readonly normalized_email: string;
  readonly email_verified: boolean;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly status: UserIdentity["status"];
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
  readonly last_authenticated_at: string | Date;
};

type MembershipRow = {
  readonly membership_id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly role: TenantMembershipRole;
  readonly status: TenantMembership["status"];
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
  readonly revoked_at: string | Date | null;
};

type GrantRow = {
  readonly grant_id: string;
  readonly tenant_id: string;
  readonly card_id: string;
  readonly user_id: string;
  readonly permission_set: IdentityPermission[];
  readonly created_at: string | Date;
  readonly expires_at: string | Date | null;
  readonly revoked_at: string | Date | null;
};

type SessionRow = {
  readonly session_id: string;
  readonly user_id: string;
  readonly tenant_id: string;
  readonly provider: "workos";
  readonly provider_session_id: string | null;
  readonly authentication_method: string;
  readonly created_at: string | Date;
  readonly last_seen_at: string | Date;
  readonly idle_expires_at: string | Date;
  readonly absolute_expires_at: string | Date;
  readonly revoked_at: string | Date | null;
  readonly rotated_from_session_id: string | null;
};

type OAuthRow = {
  readonly transaction_id: string;
  readonly transaction_token_hash: string;
  readonly state_hash: string;
  readonly nonce_hash: string;
  readonly code_verifier_ciphertext: string;
  readonly return_to: string;
  readonly created_at: string | Date;
  readonly expires_at: string | Date;
  readonly consumed_at: string | Date | null;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function nullableIso(value: string | Date | null): string | null {
  return value ? iso(value) : null;
}

function first<Row>(result: IdentityQueryResult<Row>): Row | null {
  return result.rows[0] ?? null;
}

function mapIdentity(row: UserIdentityRow): UserIdentity {
  return {
    avatarUrl: row.avatar_url,
    createdAt: iso(row.created_at),
    displayName: row.display_name,
    email: row.email,
    emailVerified: row.email_verified,
    lastAuthenticatedAt: iso(row.last_authenticated_at),
    normalizedEmail: row.normalized_email,
    provider: row.provider,
    providerSubject: row.provider_subject,
    status: row.status,
    updatedAt: iso(row.updated_at),
    userId: row.user_id
  };
}

function mapMembership(row: MembershipRow): TenantMembership {
  return {
    createdAt: iso(row.created_at),
    membershipId: row.membership_id,
    revokedAt: nullableIso(row.revoked_at),
    role: row.role,
    status: row.status,
    tenantId: row.tenant_id,
    updatedAt: iso(row.updated_at),
    userId: row.user_id
  };
}

function mapGrant(row: GrantRow): CardAccessGrant {
  return {
    cardId: row.card_id,
    createdAt: iso(row.created_at),
    expiresAt: nullableIso(row.expires_at),
    grantId: row.grant_id,
    permissionSet: row.permission_set,
    revokedAt: nullableIso(row.revoked_at),
    tenantId: row.tenant_id,
    userId: row.user_id
  };
}

function mapSession(row: SessionRow): ApplicationSession {
  return {
    absoluteExpiresAt: iso(row.absolute_expires_at),
    authenticationMethod: row.authentication_method,
    createdAt: iso(row.created_at),
    idleExpiresAt: iso(row.idle_expires_at),
    lastSeenAt: iso(row.last_seen_at),
    provider: row.provider,
    providerSessionId: row.provider_session_id,
    revokedAt: nullableIso(row.revoked_at),
    rotatedFromSessionId: row.rotated_from_session_id,
    sessionId: row.session_id,
    tenantId: row.tenant_id,
    userId: row.user_id
  };
}

function mapOAuth(row: OAuthRow): StoredOAuthTransaction {
  return {
    codeVerifier: "",
    codeVerifierCiphertext: row.code_verifier_ciphertext,
    consumedAt: nullableIso(row.consumed_at),
    createdAt: iso(row.created_at),
    expiresAt: iso(row.expires_at),
    nonceHash: row.nonce_hash,
    returnTo: row.return_to,
    stateHash: row.state_hash,
    transactionId: row.transaction_id,
    transactionTokenHash: row.transaction_token_hash
  };
}

export function createIdentityRepository(
  executor: IdentityQueryExecutor
): IdentityRepository {
  return {
    async upsertProviderIdentity(identity, now) {
      const userId = `usr_${identity.providerSubject}`;
      const normalizedEmail = identity.email.trim().toLowerCase();
      const result = await executor.query<UserIdentityRow>(
        `insert into user_identities (
           user_id, provider, provider_subject, email, normalized_email,
           email_verified, display_name, avatar_url, status,
           created_at, updated_at, last_authenticated_at
         ) values ($1, 'workos', $2, $3, $4, $5, $6, $7, 'active', $8, $8, $8)
         on conflict (provider, provider_subject) do update set
           email = excluded.email,
           normalized_email = excluded.normalized_email,
           email_verified = excluded.email_verified,
           display_name = excluded.display_name,
           avatar_url = excluded.avatar_url,
           updated_at = excluded.updated_at,
           last_authenticated_at = excluded.last_authenticated_at
         returning *`,
        [
          userId,
          identity.providerSubject,
          identity.email,
          normalizedEmail,
          identity.emailVerified,
          identity.displayName,
          identity.avatarUrl ?? null,
          now
        ]
      );
      const row = first(result);
      if (!row) throw new Error("Identity upsert failed.");
      return mapIdentity(row);
    },

    async saveProviderAccount(account) {
      const result = await executor.query<{
        readonly provider_account_id: string;
        readonly user_id: string;
        readonly provider: "workos";
        readonly provider_subject: string;
        readonly provider_tenant_id: string | null;
        readonly provider_metadata: IdentityProviderAccount["providerMetadata"];
        readonly created_at: string | Date;
        readonly updated_at: string | Date;
      }>(
        `insert into identity_provider_accounts (
           provider_account_id, user_id, provider, provider_subject,
           provider_tenant_id, provider_metadata, created_at, updated_at
         ) values ($1, $2, 'workos', $3, $4, $5, $6, $7)
         on conflict (provider, provider_subject) do update set
           provider_tenant_id = excluded.provider_tenant_id,
           provider_metadata = excluded.provider_metadata,
           updated_at = excluded.updated_at
         returning *`,
        [
          account.providerAccountId,
          account.userId,
          account.providerSubject,
          account.providerTenantId ?? null,
          account.providerMetadata,
          account.createdAt,
          account.updatedAt
        ]
      );
      const row = first(result);
      if (!row) throw new Error("Provider account upsert failed.");
      return {
        createdAt: iso(row.created_at),
        provider: row.provider,
        providerAccountId: row.provider_account_id,
        providerMetadata: row.provider_metadata,
        providerSubject: row.provider_subject,
        providerTenantId: row.provider_tenant_id,
        updatedAt: iso(row.updated_at),
        userId: row.user_id
      };
    },

    async getIdentity(userId) {
      const row = first(
        await executor.query<UserIdentityRow>(
          "select * from user_identities where user_id = $1",
          [userId]
        )
      );
      return row ? mapIdentity(row) : null;
    },

    async getTenantIdForProviderTenant(providerTenantId) {
      const row = first(
        await executor.query<{ readonly tenant_id: string }>(
          `select tenant_id from identity_provider_tenant_links
            where provider = 'workos' and provider_tenant_id = $1`,
          [providerTenantId]
        )
      );
      return row?.tenant_id ?? null;
    },

    async listActiveMemberships(userId) {
      const result = await executor.query<MembershipRow>(
        `select * from tenant_memberships
          where user_id = $1 and status = 'active' and revoked_at is null
          order by created_at asc, membership_id asc`,
        [userId]
      );
      return result.rows.map(mapMembership);
    },

    async listActiveCardGrants(userId, tenantId, now) {
      const result = await executor.query<GrantRow>(
        `select * from card_access_grants
          where user_id = $1 and tenant_id = $2
            and revoked_at is null
            and (expires_at is null or expires_at > $3)
          order by card_id asc, grant_id asc`,
        [userId, tenantId, now]
      );
      return result.rows.map(mapGrant);
    },

    async createSession(session) {
      const result = await executor.query<SessionRow>(
        `insert into application_sessions (
           session_id, session_token_hash, csrf_token_hash, user_id, tenant_id,
           provider, provider_session_id, authentication_method, created_at,
           last_seen_at, idle_expires_at, absolute_expires_at, revoked_at,
           rotated_from_session_id
         ) values ($1, $2, $3, $4, $5, 'workos', $6, $7, $8, $9, $10, $11, $12, $13)
         returning *`,
        [
          session.sessionId,
          session.sessionTokenHash,
          session.csrfTokenHash,
          session.userId,
          session.tenantId,
          session.providerSessionId ?? null,
          session.authenticationMethod,
          session.createdAt,
          session.lastSeenAt,
          session.idleExpiresAt,
          session.absoluteExpiresAt,
          session.revokedAt ?? null,
          session.rotatedFromSessionId ?? null
        ]
      );
      const row = first(result);
      if (!row) throw new Error("Session creation failed.");
      return mapSession(row);
    },

    async getSessionByTokenHash(tokenHash) {
      const row = first(
        await executor.query<SessionRow>(
          `select * from application_sessions
            where session_token_hash = $1 and revoked_at is null`,
          [tokenHash]
        )
      );
      return row ? mapSession(row) : null;
    },

    async verifySessionCsrf(sessionId, csrfTokenHash) {
      const row = first(
        await executor.query<{ readonly session_id: string }>(
          "select session_id from application_sessions where session_id = $1 and csrf_token_hash = $2 and revoked_at is null",
          [sessionId, csrfTokenHash]
        )
      );
      return Boolean(row);
    },
    async touchSession(sessionId, lastSeenAt, idleExpiresAt) {
      const result = await executor.query(
        `update application_sessions
            set last_seen_at = $2, idle_expires_at = least($3, absolute_expires_at)
          where session_id = $1 and revoked_at is null`,
        [sessionId, lastSeenAt, idleExpiresAt]
      );
      return (result.rowCount ?? 0) === 1;
    },

    async revokeSession(sessionId, revokedAt) {
      const result = await executor.query(
        `update application_sessions set revoked_at = $2
          where session_id = $1 and revoked_at is null`,
        [sessionId, revokedAt]
      );
      return (result.rowCount ?? 0) === 1;
    },

    async revokeSessionsByProviderSession(providerSessionId, revokedAt) {
      const result = await executor.query(
        `update application_sessions set revoked_at = $2
          where provider_session_id = $1 and revoked_at is null`,
        [providerSessionId, revokedAt]
      );
      return result.rowCount ?? 0;
    },

    async saveOAuthTransaction(transaction) {
      await executor.query(
        `insert into identity_oauth_transactions (
           transaction_id, transaction_token_hash, state_hash, nonce_hash,
           code_verifier_ciphertext, return_to, created_at, expires_at, consumed_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, null)`,
        [
          transaction.transactionId,
          transaction.transactionTokenHash,
          transaction.stateHash,
          transaction.nonceHash,
          transaction.codeVerifierCiphertext,
          transaction.returnTo,
          transaction.createdAt,
          transaction.expiresAt
        ]
      );
    },

    async consumeOAuthTransaction(transactionTokenHash, stateHash, now) {
      const row = first(
        await executor.query<OAuthRow>(
          `update identity_oauth_transactions
              set consumed_at = $3
            where transaction_token_hash = $1
              and state_hash = $2
              and consumed_at is null
              and expires_at > $3
          returning *`,
          [transactionTokenHash, stateHash, now]
        )
      );
      return row ? mapOAuth(row) : null;
    },

    async saveAuditEvent(event) {
      await executor.query(
        `insert into identity_audit_events (
           event_id, event_type, user_id, tenant_id, session_id, provider,
           occurred_at, result, reason_code, metadata
         ) values ($1, $2, $3, $4, $5, 'workos', $6, $7, $8, $9)
         on conflict (event_id) do nothing`,
        [
          event.eventId,
          event.eventType,
          event.userId ?? null,
          event.tenantId ?? null,
          event.sessionId ?? null,
          event.occurredAt,
          event.result,
          event.reasonCode,
          event.metadata
        ]
      );
    },

    async saveWebhookReceipt(webhook, payloadHash, receivedAt) {
      const result = await executor.query(
        `insert into identity_webhook_receipts (
           provider, provider_event_id, event_type, occurred_at, received_at, payload_hash
         ) values ('workos', $1, $2, $3, $4, $5)
         on conflict (provider, provider_event_id) do nothing`,
        [webhook.eventId, webhook.eventType, webhook.occurredAt, receivedAt, payloadHash]
      );
      return (result.rowCount ?? 0) === 1;
    },

    async disableIdentityByProviderSubject(providerSubject, now) {
      const row = first(
        await executor.query<{ readonly user_id: string }>(
          `update user_identities
              set status = 'disabled', updated_at = $2
            where provider = 'workos' and provider_subject = $1
          returning user_id`,
          [providerSubject, now]
        )
      );
      return row?.user_id ?? null;
    }
  };
}
