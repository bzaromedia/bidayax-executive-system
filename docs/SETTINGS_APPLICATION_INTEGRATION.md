# Settings Application Integration

Phase 4 replaces the previous preview-only description with an API-backed settings workspace status inside the dashboard settings page.

## Dashboard Integration

`apps/dashboard/app/settings/card-customization/page.tsx` now passes an API integration summary into `CardCustomizationSettings`:

- persistence mode
- API route list
- cache invalidation strategy
- local `DATABASE_URL` warning

The visual Settings Dashboard remains token-governed and does not introduce app-level color literals.

## API Helper

`apps/dashboard/src/lib/card-customization-settings-api.ts` now wraps settings reads and writes with:

- URL-safe slug validation
- trusted signed-session authorization
- typed success/error envelopes
- route-scoped cache keys
- settings API metrics
- safe unconfigured database behavior
- no tenant or role override from plain request headers

## Persistence Boundary

Phase 4 does not weaken Phase 3 persistence rules. Immutable published versions, append-only audit events, idempotent publish behavior, and transaction guarantees remain owned by `@bidayax/settings` persistence services.
