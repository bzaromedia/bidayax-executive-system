# Phase 5 Identity Provider Integration

Phase 5 replaces temporary settings-session issuance with a production identity-provider path for the Settings environment. The selected reference provider is WorkOS AuthKit. External identity proves who the user is; BidayaX internal records remain the source of truth for tenant, role, card scope, and settings permissions.

## Implemented

- WorkOS AuthKit authorization-code login initiation and callback routes.
- Server-side OAuth transaction storage with hashed state, encrypted PKCE verifier, expiry, and one-time consumption.
- Provider access-token verification with issuer, audience, signature, expiration, not-before, and clock-skew checks.
- Internal identity tables for users, provider accounts, tenant memberships, card grants, sessions, OAuth transactions, identity audit events, and webhook receipts.
- Opaque HttpOnly application-session cookies with a separate double-submit CSRF cookie.
- Session expiry, idle timeout extension, rotation, revocation, logout, provider logout URL generation, and webhook replay protection.
- Dashboard settings authorization derived from the verified application session and internal membership/grant records.
- Fail-closed production behavior when mandatory identity configuration is missing.
- Explicit development identity mode guarded by `IDENTITY_DEVELOPMENT_MODE=true` and blocked when `NODE_ENV=production`.

## Not Implemented In Phase 5

- Production WorkOS tenant creation or credential provisioning.
- Live telephony, SIP, voice runtime, call recording, or phone-number provisioning.
- Multiple identity providers.
- Provider-side organization role mapping as an authorization source.
- Legal/compliance certification claims.

## Runtime Flow

1. User opens the Settings dashboard unauthenticated.
2. Dashboard displays login initiation.
3. `/auth/login` creates a one-time OAuth transaction and redirects to WorkOS AuthKit.
4. `/auth/callback` validates state, consumes the transaction, exchanges the code, verifies the provider token, and maps provider identity to an internal user.
5. Internal tenant membership and card grants are resolved server-side.
6. BidayaX issues an opaque application session and CSRF token.
7. Settings APIs resolve a `TrustedSettingsAuthorizationContext` from internal records only.
8. Draft, preview, and publish operations continue to enforce Phase 2-4H persistence, immutability, audit, and idempotency controls.

## Required Production Configuration

- `DASHBOARD_BASE_URL` or `APP_BASE_URL`
- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_WEBHOOK_SECRET`
- `WORKOS_REDIRECT_URI`
- `IDENTITY_TRANSACTION_ENCRYPTION_KEY`
- `IDENTITY_ALLOWED_AUDIENCE` when the WorkOS audience differs from client ID
- `IDENTITY_ALLOWED_REDIRECT_ORIGINS`
- `IDENTITY_SESSION_IDLE_SECONDS`
- `IDENTITY_SESSION_ABSOLUTE_SECONDS`
- `IDENTITY_CLOCK_SKEW_SECONDS`
- `IDENTITY_COOKIE_DOMAIN`
- `IDENTITY_SECURE_COOKIES=true` in production

## Acceptance Criteria

- Identity provider token validation rejects malformed, wrong-issuer, wrong-audience, invalid-signature, expired, not-before, and replayed evidence.
- Tenant, role, permission, and card access are never accepted from browser-controlled headers.
- Revoked memberships and disabled identities cannot authorize settings access.
- Sessions are revocable and expire by idle and absolute limits.
- Identity audit events are sanitized and append-only.
- Full migration chain and disposable PostgreSQL integration tests pass before merge.
