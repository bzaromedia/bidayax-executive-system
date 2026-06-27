# Deployment Runbook

## Local Verification

```bash
pnpm install
pnpm verify
pnpm verify:production
```

## VPS Deployment

1. Prepare the server with Docker, Git, Node, and pnpm.
2. Create `.env.production` from `.env.production.example`.
3. Set DNS for card and dashboard domains.
4. Run `pwsh infrastructure/hostinger-vps/DEPLOY.ps1`.
5. Check `/api/system/health`.
6. Check `/api/system/readiness`.
7. Inspect Docker logs.

## Logs

```powershell
docker compose -f infrastructure/docker/docker-compose.production.yml logs dashboard
docker compose -f infrastructure/docker/docker-compose.production.yml logs card
```

## Traffic

Only route public traffic after health, readiness, and logs are reviewed.

