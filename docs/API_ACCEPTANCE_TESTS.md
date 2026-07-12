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
