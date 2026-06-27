# Hostinger VPS Deployment Guide

## Prerequisites

- Hostinger VPS with Docker and Docker Compose installed.
- DNS records for the card and dashboard domains pointing to the VPS.
- Ports 80 and 443 open.
- `.env.production` created from `.env.production.example`.
- Real secrets stored only on the server.

## Server Prep

Run:

```powershell
pwsh infrastructure/hostinger-vps/SERVER_PREP.ps1
```

Review the output and install missing dependencies manually if needed.

## Deploy

Run:

```powershell
pwsh infrastructure/hostinger-vps/DEPLOY.ps1
```

The deploy script validates migrations and builds the Docker services. It does
not enable live calling.

## Verify

```powershell
pnpm verify
pnpm verify:production
Invoke-WebRequest https://dashboard.example.com/api/system/health
Invoke-WebRequest https://dashboard.example.com/api/system/readiness
```

## Logs

```powershell
docker compose -f infrastructure/docker/docker-compose.production.yml logs dashboard
docker compose -f infrastructure/docker/docker-compose.production.yml logs card
docker compose -f infrastructure/docker/docker-compose.production.yml logs postgres
```

## Rollback

Use `ROLLBACK.ps1` with a known Git ref. Always take a database backup first.

