# Infrastructure Discovery

Project: The Executive Card™  
Domain: https://theexecutivecard.online  
Deployment target: Hostinger VPS  
DNS and email provider: Namecheap

## Owner Decisions Applied

| Decision | Value |
| --- | --- |
| Hostinger VPS IPv4 | `187.124.251.190` |
| Hostinger OS/version | Ubuntu 24.04 with Docker |
| Hostinger hostname | `srv1557534.hstgr.cloud` |
| Caddy runtime | Host-level Caddy |
| DNS provider | Namecheap |
| Email provider | Namecheap Private Email for inboxes |
| Transactional email | Resend deferred until application-sent email is implemented |
| DMARC launch policy | `p=none` |
| Production PostgreSQL | Compose-managed Postgres for launch |
| Dashboard exposure | Password-protected `dashboard.theexecutivecard.online` |
| VPS isolation | Dedicated project directory, Compose project name, localhost-only ports, dedicated Postgres volume, and Caddy site snippet |

## Discovery Result

Deployment readiness status: READY FOR HOSTINGER CONFIGURATION

No deployment was performed. No DNS, email, SSL, environment, or Docker state was changed.

## Repository Sources Inspected

- `.env.example`
- `.env.production.example`
- `package.json`
- `turbo.json`
- `apps/card`
- `apps/dashboard`
- `packages/config`
- `services/*`
- `scripts/*`
- `infrastructure/caddy/Caddyfile`
- `infrastructure/caddy/README.md`
- `infrastructure/docker/docker-compose.production.yml`
- `infrastructure/docker/Dockerfile.card`
- `infrastructure/docker/Dockerfile.dashboard`
- `infrastructure/docker/README.md`
- `infrastructure/hostinger-vps/*.ps1`
- `infrastructure/hostinger-vps/DEPLOYMENT_GUIDE.md`

## Expected Domains

| Domain | Source | Purpose | Status |
| --- | --- | --- | --- |
| `theexecutivecard.online` | `.env.production.example` `APP_BASE_URL`, `CARD_BASE_URL` | Public card application | Required |
| `dashboard.theexecutivecard.online` | `.env.production.example` `DASHBOARD_BASE_URL` | Internal dashboard application | Required if dashboard is exposed publicly |

`www.theexecutivecard.online` is not configured in the current application routes. It may be added as a redirect-only host in the host-level Caddyfile if the owner wants `www` to resolve.

## Expected Ports

| Port | Source | Purpose | Exposure |
| --- | --- | --- | --- |
| `80` | Caddy automatic HTTPS | HTTP challenge and redirects | Public firewall open |
| `443` | Caddy automatic HTTPS | HTTPS traffic | Public firewall open |
| `3000` | `Dockerfile.card`, `docker-compose.production.yml` | Card app container port | Container-internal |
| `3001` | `Dockerfile.dashboard`, `docker-compose.production.yml` | Dashboard app container port | Container-internal |
| `3100` | B4 host-level Caddy isolation plan | Card app host loopback port | Bind to `127.0.0.1` only |
| `3101` | B4 host-level Caddy isolation plan | Dashboard app host loopback port | Bind to `127.0.0.1` only |
| `5432` | `postgres:17-alpine` container | PostgreSQL | Internal Docker network; do not expose publicly unless explicitly required |

## Reverse Proxy

`infrastructure/caddy/Caddyfile` expects these environment variables:

| Variable | Purpose |
| --- | --- |
| `CADDY_ADMIN_EMAIL` | Email used by Caddy/ACME for certificate administration |
| `CARD_DOMAIN` | Hostname routed to `card:3000` |
| `DASHBOARD_DOMAIN` | Hostname routed to `dashboard:3001` |

Current routes:

```text
CARD_DOMAIN -> card:3000
DASHBOARD_DOMAIN -> dashboard:3001
```

Caddy is configured to handle HTTPS automatically once DNS points to the VPS and ports `80` and `443` are open.

For the selected host-level Caddy runtime, deploy the host-level Caddy snippet documented in `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`. It proxies to `127.0.0.1:3100` and `127.0.0.1:3101` instead of Docker service names so this project does not collide with other projects on the same VPS.

## Docker Services

| Service | Image/build | Source | Purpose |
| --- | --- | --- | --- |
| `postgres` | `postgres:17-alpine` | `docker-compose.production.yml` | Production PostgreSQL |
| `card` | `infrastructure/docker/Dockerfile.card` | `apps/card` | Public card app |
| `dashboard` | `infrastructure/docker/Dockerfile.dashboard` | `apps/dashboard` | Internal dashboard app |

The compose file does not include a Caddy service. This is intentional for the selected launch plan: Caddy runs at the host level and Docker Compose runs Postgres, card, and dashboard. Run Docker Compose with project name `the-executive-card` and project-specific localhost ports so container names, networks, and volumes do not collide with other VPS projects.

## PostgreSQL Requirements

| Requirement | Source |
| --- | --- |
| PostgreSQL database | `docker-compose.production.yml`, `.env.production.example`, app database queries |
| PostgreSQL version | `postgres:17-alpine` in compose |
| `DATABASE_URL` | `.env.production.example`, app and service code |
| `DATABASE_SSL` | `.env.production.example`, database clients |
| `PG_POOL_MAX` | `.env.production.example`, database clients |
| `POSTGRES_PASSWORD` | `docker-compose.production.yml` required environment |
| Backups | `scripts/backup-database.ps1`, `infrastructure/hostinger-vps/BACKUP.ps1` |
| Restore | `scripts/restore-database.ps1` |

## Redis Requirements

No Redis service is required by the current repository.

Redis is referenced only as a possible future addition in documentation. It is not required for RC1 deployment.

## Object Storage Requirements

No object storage service is required by the current repository.

No S3, bucket, blob storage, or file-upload dependency was found in active app configuration.

## Email Requirements

The application currently uses `mailto:` links; it does not send application email.

Current production card profile data uses:

- `contact@theexecutivecard.com`

Owner preference is to use Namecheap Private Email for product-domain inboxes. This requires Namecheap mailbox and DNS configuration, but no SMTP variables are required by the current application unless future app-sent email is added.

## Health And Readiness Endpoints

| Endpoint | Source | Purpose |
| --- | --- | --- |
| `/api/system/health` | `apps/dashboard/app/api/system/health/route.ts` | Basic dashboard health |
| `/api/system/readiness` | `apps/dashboard/app/api/system/readiness/route.ts` | Environment, database, provider, and voice safety readiness |

## Deployment Scripts

| Script | Purpose |
| --- | --- |
| `infrastructure/hostinger-vps/SERVER_PREP.ps1` | Checks for `docker`, `git`, `node`, and `pnpm`; reminds to open `80/443` |
| `infrastructure/hostinger-vps/DEPLOY.ps1` | Runs migration verification, production readiness check, Docker build, and Docker Compose start |
| `infrastructure/hostinger-vps/BACKUP.ps1` | Calls database backup script |
| `infrastructure/hostinger-vps/ROLLBACK.ps1` | Stops containers, checks out a Git ref, rebuilds, and restarts containers |
| `scripts/backup-database.ps1` | Uses `pg_dump`; requires `DATABASE_URL` |
| `scripts/restore-database.ps1` | Uses `pg_restore`; requires `DATABASE_URL` and explicit confirmation |

## Current Infrastructure Gaps

- Production `.env.production` must be created on the server and must not be committed.
- Production database migrations must be applied/verified against the real database after deployment.
- Dashboard basic-auth credentials must be generated on the VPS with `caddy hash-password`.
- The exact full DKIM TXT value must be copied from Namecheap after mailbox/DKIM setup; the screenshot value is visually truncated.
