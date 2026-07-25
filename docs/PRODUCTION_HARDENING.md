# Production Hardening

Historical status: completed v1.0 hardening tranche.

This document supports the earlier production-hardening phase record. It does
not close the active Phase 11 Communications Completion roadmap. See
`docs/governance/CURRENT_PHASE_STATUS.md` and `docs/phase-11/GAP_ANALYSIS.md`.

This distinction does not reopen or invalidate the completed historical
production-hardening tranche.

Phase 11 hardens the existing The Executive Card platform without adding product
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
