# Docker Production Setup

Phase 11 adds a minimal Docker setup for Hostinger VPS deployment.

## Files

- `Dockerfile.card`: builds and runs `apps/card`.
- `Dockerfile.dashboard`: builds and runs `apps/dashboard`.
- `docker-compose.production.yml`: runs Postgres, card, and dashboard.

## Required File

Create `.env.production` from `.env.production.example` before deployment.
Do not commit real secrets.

## Commands

```powershell
docker compose -f infrastructure/docker/docker-compose.production.yml build
docker compose -f infrastructure/docker/docker-compose.production.yml up -d
docker compose -f infrastructure/docker/docker-compose.production.yml ps
```

## Notes

- This compose file does not enable live voice by default.
- `POSTGRES_PASSWORD` must be supplied through the environment.
- Database migrations are verified separately by `pnpm db:migrations:verify`.

