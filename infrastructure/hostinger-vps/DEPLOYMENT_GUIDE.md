# Hostinger VPS Deployment Guide

This guide describes the repository-owned artifacts for the dedicated Hostinger VPS launch model.

It does not authorize provisioning, Hostinger mutation, DNS changes, TLS changes, deployment, or migration execution.

## Production Model

- dedicated VPS only
- Ubuntu 24.04
- Node.js 22.17.0 in Docker build images
- pnpm 12.3.4 via deterministic pinned npm global installation
- PostgreSQL 17 on the internal Docker network
- host-level Caddy
- immutable releases under `/opt/the-executive-card/releases/<git-sha>`
- current release symlink at `/opt/the-executive-card/current`
- external secrets at `/opt/the-executive-card/shared/env/production.env`
- systemd wrapper artifact at `infrastructure/systemd/the-executive-card.service`

## Repository Artifacts

- `SERVER_PREP.ps1`
- `DEPLOY.ps1`
- `DEPLOY-RELEASE.ps1`
- `BACKUP.ps1`
- `ROLLBACK.ps1`
- `../docker/docker-compose.hostinger.yml`
- `../caddy/the-executive-card.caddy`

## External Secret Path

Use only:

```text
/opt/the-executive-card/shared/env/production.env
```

Do not place real secrets in repository-root `.env.production` files.

## Immutable Release Flow

1. build and verify a commit-pinned release artifact
2. place it under `/opt/the-executive-card/releases/<git-sha>`
3. validate compose configuration with the external environment file
4. optionally run the one-shot `migrate` profile as a preflight verification gate
5. switch `/opt/the-executive-card/current` atomically
6. start or reload the systemd wrapper

## Health And Readiness

Use only supported routes:

- dashboard health: `/api/system/health`
- dashboard readiness: `/api/system/readiness`
- card smoke route: `/card/ad-garner`

## Rollback

Rollback switches the immutable release pointer back to a prior known-good release.

Database rollback is separate and must follow the approved restore rehearsal and backup policy.
