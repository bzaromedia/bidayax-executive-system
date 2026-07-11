# Settings API

Phase 4 connects the Executive Card Modularity & Settings Layer to tenant-aware application routes. The API is intentionally conservative: reads can fall back to source-of-truth defaults when `DATABASE_URL` is not configured, but writes return a safe `database_unconfigured` response instead of pretending to persist.

## Routes

- `GET /api/settings/card-customization/[slug]`
- `POST /api/settings/card-customization/[slug]`
- `GET /api/settings/theme/[slug]`
- `POST /api/settings/theme/[slug]`
- `GET /api/settings/receptionist/[slug]`
- `POST /api/settings/receptionist/[slug]`
- `GET /api/settings/qr-feedback/[slug]`
- `POST /api/settings/qr-feedback/[slug]`

## Response Envelope

All routes return a typed envelope from `@bidayax/settings`:

- `ok`
- `requestId`
- `data` on success
- `error.code`, `error.message`, `error.requestId` on failure
- optional `authorization`
- optional `cache`
- optional `audit`

## Authentication

Production settings routes require a trusted signed settings session token. Plain request headers cannot override tenant, actor, role, or card assignment. If `SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET` is missing in production, routes fail closed with `unauthenticated`.

## Write Behavior

Write requests validate the body against the existing Zod settings schemas. Theme writes also run brand theme validation. If persistence is unavailable, write routes return HTTP `503` with `database_unconfigured`.

## Idempotency

The package-level API contracts include idempotency key normalization for publish flows. Phase 3 persistence owns idempotent publish storage; Phase 4G keeps cache invalidation and publish persistence behind successful committed publication semantics.

## PostgreSQL Status

Disposable PostgreSQL integration remains a pre-merge blocker until `pnpm test:settings-persistence:postgres` runs with a safe test database URL.
