# Live Deployment Report

Project: The Executive Card  
Phase: Recovery Phase B5 - Live Hostinger Deployment Execution  
Deployment target: Hostinger VPS  
VPS IP: `187.124.251.190`  
Deployment path: `/opt/the-executive-card/repo`  
Backup path: `/opt/the-executive-card/backups`  
Compose project: `the-executive-card`  
Report date: 2026-07-02

## Deployment Decision

READY FOR PUBLIC VALIDATION

The production card system is live on the public internet over HTTPS. Public card routes, QR, vCard, package download, dashboard protection, dashboard health, event persistence, database backup, and certificate renewal dry-run were validated.

## Isolation Result

The deployment stayed isolated from other VPS projects.

- Project files were placed under `/opt/the-executive-card`.
- Docker Compose project name is `the-executive-card`.
- Card app is bound to `127.0.0.1:3100`.
- Dashboard app is bound to `127.0.0.1:3101`.
- PostgreSQL is reachable only through the project Docker network.
- Backups are stored under `/opt/the-executive-card/backups`.
- No unrelated Docker containers were stopped or pruned.
- No unrelated project directories were modified.

## Reverse Proxy Result

The initial deployment plan used host-level Caddy, but the VPS already had Nginx bound to ports `80` and `443`. To avoid disrupting other projects, Caddy was not activated and Nginx was used through a dedicated site file instead.

Modified project-specific reverse proxy file:

- `/etc/nginx/sites-available/the-executive-card`
- `/etc/nginx/sites-enabled/the-executive-card`

Caddy status:

- Caddy was installed but inactive because Nginx already owned ports `80` and `443`.
- Caddy was not used for production traffic.
- No Caddy site is part of the active deployment path.

## Services Started

Docker Compose started the project stack successfully:

| Service | Container | Port Exposure | Status |
| --- | --- | --- | --- |
| Card app | `the-executive-card-card-1` | `127.0.0.1:3100 -> 3000/tcp` | Up |
| Dashboard | `the-executive-card-dashboard-1` | `127.0.0.1:3101 -> 3001/tcp` | Up |
| PostgreSQL | `the-executive-card-postgres-1` | Docker network only, `5432/tcp` | Healthy |

## DNS Status

Namecheap DNS was corrected from URL forwarding to VPS records.

Validated resolution:

- `theexecutivecard.online -> 187.124.251.190`
- `www.theexecutivecard.online -> 187.124.251.190`
- `dashboard.theexecutivecard.online -> 187.124.251.190`

The previous Namecheap URL Forward record was removed.

## SSL Status

Let's Encrypt certificate was issued successfully for:

- `theexecutivecard.online`
- `www.theexecutivecard.online`
- `dashboard.theexecutivecard.online`

Certificate location:

- `/etc/letsencrypt/live/theexecutivecard.online/fullchain.pem`
- `/etc/letsencrypt/live/theexecutivecard.online/privkey.pem`

Validation results:

- Nginx SNI served the correct certificate.
- Certbot renewal dry-run succeeded for `theexecutivecard.online`.
- HTTPS responses returned `HTTP/2 200` for card routes and assets.
- Dashboard returned `HTTP/2 401` without authentication.

## Card URL Validation

Validated public HTTPS routes:

| URL | Result |
| --- | --- |
| `https://theexecutivecard.online/card/ad-garner` | `HTTP/2 200` |
| `https://theexecutivecard.online/card/naimah-barnes` | `HTTP/2 200` |
| `https://theexecutivecard.online/card/sean-hall` | `HTTP/2 200` |
| `https://theexecutivecard.online/card/ad-garner/qr` | `HTTP/2 200`, `image/png` |
| `https://theexecutivecard.online/card/ad-garner/vcard` | `HTTP/2 200`, `text/vcard` |
| `https://theexecutivecard.online/card/ad-garner/download` | `HTTP/2 200`, `application/zip` |

## Dashboard Validation

Dashboard route:

- `https://dashboard.theexecutivecard.online`

Validation results:

- Unauthenticated request returned `HTTP/2 401`.
- `WWW-Authenticate` realm is `The Executive Card Dashboard`.
- Authenticated dashboard health returned `HTTP/2 200`.
- Dashboard health response reported production service status as healthy.

## Database Migration Status

PostgreSQL started healthy and all migration files were applied successfully:

- `0001_create_interaction_events.sql`
- `0002_create_intent_scores.sql`
- `0003_create_contact_graph.sql`
- `0004_create_receptionist_foundation.sql`
- `0005_create_telephony_preparation.sql`
- `0006_create_live_provider_readiness.sql`
- `0007_create_observability_telemetry.sql`
- `0008_create_evolutionary_improvement_engine.sql`
- `0009_add_share_click_interaction_event.sql`

Event persistence was validated by posting a production card event to:

- `https://theexecutivecard.online/api/events`

The event was written to PostgreSQL with:

- `event_type`: `card_view`
- `executive_slug`: `ad-garner`
- `session_id`: `validation-session-20260702`
- `metadata.source`: `b5_live_validation`

## Backup Status

Database backup was created successfully:

- `/opt/the-executive-card/backups/the-executive-card-20260702-014505.dump`

Backup size:

- `65K`

Restore was not executed during B5 because restore is destructive and should be tested only in a non-production restore drill.

## Security Notes

- Dashboard is protected by Nginx basic authentication.
- Production voice and outbound calling remain disabled by environment defaults.
- Public card routes include security headers from the application and HSTS from Nginx.
- The deployment terminal output included secret values during `docker compose config`; secrets are not included in this report.
- Recommended follow-up: rotate `POSTGRES_PASSWORD` and `BIDAYAX_IP_HASH_SECRET` after validation if a clean production secret posture is required.

## Remaining Warnings

- HTTPS is active through Nginx, not Caddy, because Nginx was already serving other projects on the VPS.
- Restore validation remains a B6 operational validation item.
- Full cross-device QR/contact validation remains a B6 operational validation item.
- Email inbox sending/receiving validation remains a B6 operational validation item.

## Remaining Blockers

None for B5.

## Commands Verified

The following command categories were run or validated during B5:

- Local repository verification before deployment:
  - `git status`
  - `pnpm install`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm db:migrations:verify`
- VPS deployment:
  - Docker and Docker Compose version checks
  - isolated Compose build and startup
  - PostgreSQL health check
  - SQL migration application
  - Nginx site creation and reload
  - Certbot certificate issue and renewal dry-run
  - HTTPS public route checks
  - dashboard authentication checks
  - event persistence check
  - `pg_dump` production backup

## Final Status

Recovery Phase B5 is complete.

The Executive Card production platform is READY FOR PUBLIC VALIDATION.
