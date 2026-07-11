# API Acceptance Tests

Phase 4 adds package-level tests for settings API and authorization behavior.

## Covered

- trusted signed settings session parsing
- header override rejection for tenant, role, and card assignment
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

`pnpm test:settings-persistence:postgres` applies the full migration chain when `NODE_ENV=test` and a disposable PostgreSQL URL are configured. It is expected to skip locally unless that safe database is available.
