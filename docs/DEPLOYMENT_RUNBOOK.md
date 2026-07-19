# Deployment Runbook

Canonical source of truth:

- `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`
- `docs/deployment/HOSTINGER_DEPLOYMENT_CHECKLIST.md`
- `docs/deployment/RESTORE_REHEARSAL_PLAN.md`
- `docs/deployment/MONITORING_AND_ALERTING.md`

## Local Verification

```bash
pnpm install --frozen-lockfile
pnpm verify:deployment-artifacts
pnpm verify:production
pnpm verify:public-claims
pnpm verify:no-placeholders
```

## Production Note

The canonical production model no longer uses a mutable live repository checkout or a repository-root `.env.production` file.

Use immutable releases and the external server-only environment path:

```text
/opt/the-executive-card/shared/env/production.env
```
