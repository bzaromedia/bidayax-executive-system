# Production Readiness Checklist

- [ ] `.env.production` exists on the server and is not committed.
- [ ] `pnpm verify` passes.
- [ ] `pnpm verify:production` passes or warnings are accepted.
- [ ] `pnpm db:migrations:verify` passes.
- [ ] `pnpm db:check` passes with production `DATABASE_URL`.
- [ ] `/api/system/health` returns `healthy`.
- [ ] `/api/system/readiness` returns expected status.
- [ ] Docker services are healthy.
- [ ] Caddy routes card and dashboard domains over HTTPS.
- [ ] Backups are tested.
- [ ] Rollback ref is known.
- [ ] Production voice remains disabled unless explicitly approved.
- [ ] No secrets appear in logs or dashboard.

