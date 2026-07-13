# Phase 5G Identity Security Review

## Verdict

Pass with documented limitations.

Phase 5G reviewed the WorkOS-backed identity provider integration, internal authorization boundary, application sessions, migration 0015, callback and webhook security, tenant/card authorization, audit behavior, and settings API integration.

The implementation remains blocked from full production activation until real WorkOS tenant configuration, callback URLs, webhook secrets, and live-provider acceptance tests are completed. Production calling remains disabled and no telephony provider was added.

## Security Findings Corrected

### Provider token claims

Provider access-token verification now explicitly requires an `exp` claim and rejects tokens with an `iat` too far in the future. This makes the expiration and clock-skew policy explicit instead of relying only on library defaults.

Tests added:

- valid two-part verified provider token
- wrong issuer rejection
- wrong audience rejection
- expired token rejection
- not-before rejection
- malformed token rejection
- invalid signature rejection
- missing expiration rejection
- excessive future issued-at rejection

### Session rotation replay

Session refresh now revokes the existing application session before creating the replacement session. If the old session was already revoked, refresh fails with `session_rotation_replayed` and no replacement session is issued. This prevents duplicated replacement sessions during replay or concurrent refresh attempts.

Tests added:

- one successful rotation
- replayed rotation rejection
- old-session revocation audit event
- new-session refresh audit event

### Session revocation audit

Logout and provider session revocation now emit `identity.session.revoked` audit evidence in addition to their existing events. Provider `session.revoked` webhooks record the verified provider event ID and the sanitized revoked-session count.

Tests added:

- logout records both `identity.logout` and `identity.session.revoked`
- provider webhook deduplication remains intact

### Callback and webhook failure audit

Dashboard auth routes now persist sanitized audit events for:

- missing callback `code`, `state`, or transaction cookie
- callback completion failure
- missing WorkOS webhook signature
- rejected WorkOS webhook verification or processing

These audit events do not store raw tokens, cookies, authorization headers, provider payloads, PKCE values, or secrets.

### Production environment validation

Identity environment validation now rejects:

- weak `IDENTITY_TRANSACTION_ENCRYPTION_KEY` values under 32 characters
- wildcard redirect origins
- non-origin redirect allowlist entries
- placeholder WorkOS secrets in production
- production configuration without `IDENTITY_SECURE_COOKIES=true`

Tests added:

- weak transaction key rejection
- wildcard redirect origin rejection
- production secure-cookie requirement
- placeholder secret rejection

## Provider Boundary Findings

WorkOS remains the authentication provider only. Business authorization continues to resolve from internal records:

- `user_identities`
- `identity_provider_accounts`
- `tenant_memberships`
- `card_access_grants`
- internal role-permission policy

WorkOS organization metadata is mapped only through `identity_provider_tenant_links`. It does not directly grant tenant ownership, roles, permissions, card scope, publish authority, receptionist settings authority, or audit ownership.

## Callback Security Findings

The login callback still requires:

- one unconsumed OAuth transaction
- matching state hash
- unexpired transaction
- encrypted PKCE verifier recovery
- verified provider token
- verified provider subject match
- verified email
- active internal identity
- active internal tenant membership

Failed callback paths redirect with a generic auth failure and now emit sanitized `identity.login.failed` audit events.

## Session Security Findings

Application sessions remain opaque bearer tokens with only hashes persisted in PostgreSQL. Session cookies are HttpOnly, secure in production, SameSite=Lax, path-bound, idle-expiring, absolute-expiring, revocable, and rotated on refresh.

Phase 5G tightened refresh replay behavior by consuming the old session before issuing a new session.

## CSRF Findings

Unsafe settings, refresh, and logout actions continue to require exact allowed origin plus double-submit CSRF evidence. SameSite cookies are not the only CSRF protection.

## Webhook Findings

WorkOS webhooks require a signature, bounded timestamp tolerance, payload hash, unique provider event ID, and append-only webhook receipt storage. Duplicate provider event IDs are idempotent. Rejected webhook attempts now emit sanitized `identity.provider_webhook.rejected` audit events where persistence is available.

## Tenant And Card Authorization Findings

Settings API authorization continues to derive from the application session and internal records. Browser-controlled headers such as tenant, role, card IDs, actor identity, and permissions are not authoritative.

Card access grants are tenant/card consistent through migration 0015 foreign keys. Settings repository access remains tenant-scoped after route authorization.

## Migration Findings

Migration `0015_create_identity_provider_integration.sql` remains non-destructive and compatible with the existing migration chain. It includes provider-subject uniqueness, tenant membership uniqueness, card/tenant grant consistency, active session indexes, OAuth transaction replay protection, append-only identity audit events, append-only webhook receipts, and session revocation triggers for identity or membership revocation.

## Real Provider Limitation

Real WorkOS credentials are not configured in this repository. The following still must be provisioned outside source control before production activation:

- WorkOS client ID
- WorkOS API key
- WorkOS webhook secret
- WorkOS redirect URI
- allowed redirect origins
- application base URL
- session cookie domain
- transaction encryption key
- production database URL

A live WorkOS login, callback, logout, and webhook acceptance test remains required after provisioning.

## Validation Evidence

Focused Phase 5G validation completed:

- `pnpm --filter @bidayax/identity typecheck`
- `pnpm --filter @bidayax/identity test`
- `pnpm --filter @bidayax/identity lint`

Full monorepo and disposable PostgreSQL validation must be rerun after this review commit before PR #2 can be marked ready.

## Telephony Exclusion

No telephony provider was added. Production calling remains disabled.
