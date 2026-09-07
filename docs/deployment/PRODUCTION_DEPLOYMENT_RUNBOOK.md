# Production Deployment Runbook

Project: The Executive Card™
Deployment target: Dedicated Hostinger VPS
Runtime baseline: Node.js 22.17.0 + pnpm 12.3.4
Database baseline: PostgreSQL 17
Proxy baseline: host-level Caddy

## Stop Conditions

Do not execute a live deployment until all of the following are satisfied:

- dedicated VPS exists and is approved
- DNS cutover plan is approved
- backup and restore rehearsal evidence exists
- production environment file exists outside the repository
- release artifact is built from an approved commit
- rollback plan is confirmed
- separate deployment approval is issued

## Canonical Layout

```text
/opt/the-executive-card/
  releases/
    <git-sha>/
  current -> releases/<git-sha>
  shared/
    env/
      production.env
    logs/
    backups/
    postgres/
  infrastructure/
```

## External Environment File

Use only:

```text
/opt/the-executive-card/shared/env/production.env
```

Rules:

- owner `root`
- mode `0600`
- outside the repository
- never copied into release directories
- never committed
- never printed by deployment scripts

## Release Preparation

1. build the release from an approved git SHA
2. place release payload under `/opt/the-executive-card/releases/<git-sha>`
3. verify `docker compose config` with the external environment file
4. record release metadata:
   - git SHA
   - timestamp
   - image tags or digests
   - checksum evidence
5. keep at least three known-good releases
6. never delete the current release automatically

## Compose Stack

Canonical compose files:

- `infrastructure/docker/docker-compose.hostinger.yml`
- `infrastructure/docker/docker-compose.production.yml`

Services:

- `postgres`
- `migrate` (profile-gated one-shot verification service)
- `card`
- `dashboard`

## Migration Sequence

The repository currently provides migration verification but not an automated production SQL-apply workflow.

Approved order:

1. take a fresh backup
2. verify migration inventory with `pnpm db:migrations:verify`
3. run the profile-gated `migrate` service only when approved as a preflight verification step
4. execute SQL migration application through the approved PostgreSQL operator method
5. verify database readiness
6. start or reload the application stack

## Caddy

Canonical site artifact:

- `infrastructure/caddy/the-executive-card.caddy`

Routing:

- apex → `127.0.0.1:3100`
- `www` → permanent redirect to apex
- dashboard → `127.0.0.1:3101`

Requirements:

- automatic TLS
- HSTS in the production artifact
- zstd + gzip
- explicit log files
- safe request limits
- WorkOS callback and webhook paths must not be blocked
- application-level authentication remains primary

Validation commands:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Rollback:

- restore the prior site file
- validate configuration
- reload Caddy

## systemd

Canonical wrapper artifact:

- `infrastructure/systemd/the-executive-card.service`

It starts the compose stack from `/opt/the-executive-card/current` and references the external environment file.

Installation and enablement are operator actions and are not executed by this repository phase.

## Health And Smoke Checks

Supported operational checks:

- dashboard health: `https://dashboard.theexecutivecard.online/api/system/health`
- dashboard readiness: `https://dashboard.theexecutivecard.online/api/system/readiness`
- card smoke route: `https://theexecutivecard.online/card/ad-garner`
- CSS/static asset verification from the card and dashboard routes

## Backup And Restore

- daily backups required
- mandatory pre-deployment backup required
- checksum generation and verification required
- non-production restore rehearsal required
- never test restore on production

Canonical restore procedure:

- `docs/deployment/RESTORE_REHEARSAL_PLAN.md`

## Communications Safety

The following production values must remain unchanged in this phase:

- `TELEPHONY_PROVIDER=mock`
- `TELEPHONY_PROVIDER_MODE=disabled`
- `VOICE_RUNTIME_PROVIDER=none`
- `VOICE_AGENT_ENABLED=false`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `ALLOW_PRODUCTION_CALLS=false`
- `REQUIRE_HUMAN_APPROVAL=true`

## Historical Note

The July 2026 shared-host / Nginx deployment reports are historical records only. They are not the source of truth for the dedicated-VPS launch model.
