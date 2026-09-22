# Docker Production Setup

Canonical production runtime:

- dedicated Hostinger VPS
- Ubuntu 24.04
- Node.js 22.17.0 Alpine build images
- pnpm 12.3.4 via deterministic pinned npm global installation
- host-level Caddy
- PostgreSQL 17 on the internal Docker network
- immutable releases under `/opt/the-executive-card/releases/<git-sha>`
- external secrets at `/opt/the-executive-card/shared/env/production.env`

## Files

- `Dockerfile.card`: builds and runs `apps/card` under Node.js 22.
- `Dockerfile.dashboard`: builds and runs `apps/dashboard` under Node.js 22.
- `docker-compose.production.yml`: canonical production stack definition.
- `docker-compose.hostinger.yml`: dedicated Hostinger VPS stack definition.

## Production Secret Contract

Do not store real production secrets in the repository.

Use:

```text
/opt/the-executive-card/shared/env/production.env
```

Properties:

- owner: `root`
- mode: `0600`
- outside the repository
- not copied into immutable release directories
- not printed by deployment scripts

## Compose Model

The production compose files define:

- `postgres`
- `migrate` (profile-gated one-shot verification job)
- `card`
- `dashboard`

Application ports are loopback only:

- `127.0.0.1:3100 -> 3000`
- `127.0.0.1:3101 -> 3001`

PostgreSQL is internal only and is not published to the host.

## Validation Commands

```powershell
docker compose --env-file /opt/the-executive-card/shared/env/production.env -f infrastructure/docker/docker-compose.production.yml config
docker compose --env-file /opt/the-executive-card/shared/env/production.env -f infrastructure/docker/docker-compose.hostinger.yml config
pnpm verify:deployment-artifacts
```

## Notes

- The repository does not authorize live provider activation in this phase.
- Production telephony, voice, and calling remain disabled.
- The dedicated production Caddy site artifact is `infrastructure/caddy/the-executive-card.caddy`.
