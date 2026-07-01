# Deployment Readiness

Project: The Executive Card  
Owner: BidayaX LLC  
Public URL: https://theexecutivecard.online

## Current Deployment Posture

The repository is deployment-prepared for the implemented v1.0 scope, but this review did not deploy, tag, or push the code.

## Verified Artifacts

| Area | Artifact | Status |
| --- | --- | --- |
| Environment template | `.env.example` | Present |
| Production environment template | `.env.production.example` | Present |
| Docker card image | `infrastructure/docker/Dockerfile.card` | Present |
| Docker dashboard image | `infrastructure/docker/Dockerfile.dashboard` | Present |
| Docker compose | `infrastructure/docker/docker-compose.production.yml` | Present |
| Caddy routing | `infrastructure/caddy/Caddyfile` | Present |
| Hostinger guide | `infrastructure/hostinger-vps/DEPLOYMENT_GUIDE.md` | Present |
| Hostinger scripts | `infrastructure/hostinger-vps/*.ps1` | Present |
| Health endpoint | `apps/dashboard/app/api/system/health/route.ts` | Present |
| Readiness endpoint | `apps/dashboard/app/api/system/readiness/route.ts` | Present |
| Database backup | `scripts/backup-database.ps1` | Present |
| Database restore | `scripts/restore-database.ps1` | Present |

## Verification Commands

The deployment gate depends on these commands:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrations:verify
pnpm verify:production
pnpm verify:no-missing-workspaces
pnpm verify:public-claims
pnpm verify:design-governance
pnpm verify:release-scope
pnpm verify:no-placeholders
```

## Environment Variables

Required before production deployment:

- `NODE_ENV=production`
- `DATABASE_URL`
- `DATABASE_SSL`
- `BIDAYAX_IP_HASH_SECRET`
- `APP_BASE_URL=https://theexecutivecard.online`
- `CARD_BASE_URL=https://theexecutivecard.online`
- `DASHBOARD_BASE_URL` set to the approved dashboard host
- production DNS for `theexecutivecard.online`
- working mail delivery for `contact@bidayax.com`

Telephony is a safety-gated future integration unless real provider production setup exists. Current safety defaults must remain:

- `TELEPHONY_PROVIDER=mock`
- `VOICE_AGENT_ENABLED=false`
- `VOICE_TEST_MODE=true`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `REQUIRE_HUMAN_APPROVAL=true`
- `ALLOW_PRODUCTION_CALLS=false`

## Known Limits

- No staging deployment was executed during Recovery Phase B.
- Database-backed smoke checks require a configured `DATABASE_URL`.
- The production card app cannot be treated as live until https://theexecutivecard.online routes are validated after deployment.
- `contact@bidayax.com` must be configured and tested before public operational use.
- Production voice remains disabled by default and is not a v1.0 live calling feature.
- Marketing website deployment is out of scope until the enterprise readiness gate is accepted.
