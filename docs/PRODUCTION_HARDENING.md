# Production Hardening

Phase 11 hardens the existing BidayaX Executive System without adding product
features.

## Hardening Scope

- Environment validation.
- Security headers.
- Health and readiness endpoints.
- Structured logging.
- Safe error helpers.
- Migration verification.
- Database connectivity checks.
- Backup and restore scripts.
- Docker production setup.
- Caddy reverse proxy config.
- Hostinger VPS runbooks.
- Dashboard production warnings.

## Verification Commands

```bash
pnpm verify
pnpm verify:production
pnpm db:migrations:verify
pnpm db:check
```

`pnpm db:check` requires `DATABASE_URL`.

## Safety Defaults

Production calls, outbound calls, and voice agent behavior remain disabled by
default. Phase 11 does not enable live unsupervised voice, email automation,
calendar booking, CRM, enrichment, payments, or recursive improvement.

