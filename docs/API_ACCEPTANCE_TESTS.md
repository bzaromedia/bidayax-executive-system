# API Acceptance Tests

Phase 5 extends Phase 4 API acceptance with production identity-session enforcement.

## Covered By Package And App Tests

- WorkOS provider token validation helpers.
- Wrong issuer rejection.
- Wrong audience rejection.
- Invalid signature rejection.
- Expired token rejection.
- Not-before rejection.
- Malformed token rejection.
- State mismatch and replay rejection.
- Unverified email rejection.
- Missing membership denial.
- Revoked membership denial.
- Cross-tenant denial through internal authorization context.
- Unauthorized-card denial through explicit card grants.
- Permission denial through deny-by-default role policy.
- Session creation, expiry, rotation, CSRF validation, and revocation.
- Development mode blocked in production.
- Audit metadata sanitization.
- Provider webhook verification and replay rejection.
- Settings API 401/403/503 behavior through dashboard auth context.

## Required Commands

```bash
pnpm --filter @bidayax/identity typecheck
pnpm --filter @bidayax/identity test
pnpm --filter @bidayax/identity lint
pnpm --filter @bidayax/settings typecheck
pnpm --filter @bidayax/settings test
pnpm --filter @bidayax/settings lint
pnpm --filter @bidayax/dashboard typecheck
pnpm --filter @bidayax/dashboard test
pnpm --filter @bidayax/dashboard lint
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm db:migrations:verify
pnpm verify:design-governance
pnpm verify:public-claims
pnpm verify:production
pnpm test:settings-persistence:postgres
```

`pnpm test:settings-persistence:postgres` must use `NODE_ENV=test` and a disposable PostgreSQL database. It must not run against production or unknown database URLs.

## Phase 5G Identity Security Review Coverage

Additional Phase 5G checks added before PR #2 readiness:

- Provider tokens without `exp` are rejected.
- Provider tokens with `iat` beyond allowed clock skew are rejected.
- Existing issuer, audience, signature, expiry, not-before, malformed-token, nonce, and webhook timestamp tests remain active.
- Application session refresh consumes the old session before issuing the replacement.
- Replayed session refresh is rejected with `session_rotation_replayed`.
- Logout emits both `identity.logout` and `identity.session.revoked` audit evidence.
- Provider session revocation webhook processing emits sanitized `identity.session.revoked` evidence.
- Missing callback evidence, callback failures, missing webhook signatures, and webhook verification failures emit sanitized audit events where persistence is available.
- Production identity configuration rejects weak transaction keys, wildcard redirect origins, placeholder production secrets, and insecure production cookies.

Real WorkOS login, callback, logout, and webhook acceptance tests remain pending until real provider credentials and callback/webhook configuration are provisioned outside source control.
