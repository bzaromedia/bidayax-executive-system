# Phase 4G Production Authentication And Merge Readiness

Phase 4G hardens the Settings API integration before PR merge readiness.

## Completed In This Phase

- Replaced the Phase 4 header-based settings auth adapter with trusted server-side settings session context.
- Added signed cookie / bearer token verification for settings routes.
- Added reusable trusted settings auth claim validation in `@bidayax/settings`.
- Added dashboard tests proving tenant and role identity come from signed claims, not override headers.
- Upgraded the PostgreSQL settings persistence harness to apply the complete migration chain inside the disposable test transaction.
- Preserved local development fallback only when no trusted auth secret is configured outside production.

## Production Auth Rules

Production settings routes require `SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET` and a signed trusted settings token. Plain request headers such as `x-tenant-id`, `x-settings-role`, `x-actor-id`, and `x-card-ids` are not trusted for settings identity.

Trusted tokens may be supplied by:

- `bidayax_settings_session` signed cookie
- `Authorization: Bearer <signed-settings-token>`

The signed payload must contain:

- `actorId`
- `displayName`
- `role`
- `tenantId`
- optional `cardIds`
- optional `expiresAt`
- optional `issuedAt`

## PostgreSQL Integration Status

The harness now applies all SQL migrations in `database/migrations` in lexical order, then validates settings tables, duplicate active publish rejection, published-version immutability, audit-event immutability, and idempotency conflict behavior.

The harness still requires a disposable database and safety guard:

```bash
NODE_ENV=test SETTINGS_PERSISTENCE_TEST_DATABASE_URL=postgres://... pnpm test:settings-persistence:postgres
```

The database name must contain `test`, `ci`, or `local`.

## Merge Readiness

PR #1 must remain unmerged until the disposable PostgreSQL test is run successfully in an isolated database environment.
