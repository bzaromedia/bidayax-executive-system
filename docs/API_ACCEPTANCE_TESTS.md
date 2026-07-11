# API Acceptance Tests

Phase 4 adds package-level tests for settings API and authorization behavior.

## Covered

- administrator tenant-scoped publish authorization
- cross-tenant read denial
- executive publish denial
- executive unassigned-card denial
- URL-safe settings slug validation
- idempotency key validation
- pagination limit capping
- typed API success/failure envelopes
- tenant-scoped cache keys
- card-specific cache invalidation
- settings metric creation
- sensitive metadata sanitization
- asset tenant ownership validation
- allowed asset reference validation

## Validation Commands

Run:

```bash
pnpm --filter @bidayax/settings typecheck
pnpm --filter @bidayax/settings test
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

`pnpm test:settings-persistence:postgres` is expected to skip unless a disposable PostgreSQL test URL is configured with the required safety guard.
