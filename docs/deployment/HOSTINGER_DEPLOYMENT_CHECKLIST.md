# Hostinger Deployment Checklist

Project: The Executive Card™  
Deployment target: Hostinger VPS  
DNS and email provider: Namecheap

## 1. Owner Inputs

- [x] Hostinger VPS IPv4 address supplied: `187.124.251.190`.
- [ ] Hostinger VPS IPv6 address supplied if available.
- [x] Hostinger OS version supplied: Ubuntu 24.04 with Docker.
- [ ] SSH access method confirmed.
- [ ] Namecheap DNS access confirmed.
- [x] Namecheap Email plan and DNS records confirmed for MX/SPF; DKIM must be copied exactly after mailbox setup.
- [x] Production dashboard exposure decision confirmed: password-protected dashboard subdomain.

## 2. Server Preparation

- [ ] Connect to the Hostinger VPS over SSH or the approved management shell.
- [x] Confirm OS version: Ubuntu 24.04 with Docker.
- [ ] Create dedicated project directory `/opt/the-executive-card`.
- [ ] Do not place this project inside another project's deployment directory.
- [ ] Install or verify `git`.
- [ ] Install or verify Docker.
- [ ] Install or verify Docker Compose plugin.
- [ ] Install or verify Node.js compatible with the Docker/build workflow.
- [ ] Install or verify `pnpm`.
- [ ] Install or verify PostgreSQL client tools if using `pg_dump` and `pg_restore` on the host.
- [ ] Run `pwsh infrastructure/hostinger-vps/SERVER_PREP.ps1` if PowerShell is available.

## 3. Firewall

- [ ] Open inbound TCP `80`.
- [ ] Open inbound TCP `443`.
- [ ] Keep PostgreSQL `5432` closed to the public internet unless a specific secure external database plan is chosen.
- [ ] Restrict SSH to approved access methods.

## 4. DNS In Namecheap

- [ ] Add Namecheap A record `@ -> 187.124.251.190`.
- [ ] Add Namecheap A record `dashboard -> 187.124.251.190`.
- [ ] Add optional Namecheap CNAME `www -> @` only if the host-level Caddyfile includes the `www` redirect host.
- [ ] Do not add `api` or `docs` records unless the routing plan is updated.
- [ ] Wait for DNS propagation.

## 5. Email In Namecheap

- [ ] Create or alias `contact@theexecutivecard.online`.
- [ ] Create or alias `support@theexecutivecard.online`.
- [ ] Create or alias `sales@theexecutivecard.online`.
- [ ] Create or alias `hello@theexecutivecard.online`.
- [ ] Create or alias `notifications@theexecutivecard.online`.
- [ ] Create or alias `noreply@theexecutivecard.online`.
- [ ] Add MX `@`, priority `10`, value `mx1.privateemail.com`.
- [ ] Add MX `@`, priority `10`, value `mx2.privateemail.com`.
- [ ] Add TXT `@`, value `v=spf1 include:spf.privateemail.com ~all`.
- [ ] Copy DKIM TXT record from Namecheap Email exactly.
- [ ] Add TXT `_dmarc`, value `v=DMARC1; p=none`.
- [ ] Send and receive test messages.

## 6. Environment Variables

- [ ] Create `.env.production` on the VPS from `.env.production.example`.
- [ ] Set `NODE_ENV=production`.
- [ ] Set `DATABASE_URL`.
- [ ] Set `DATABASE_SSL` according to database topology.
- [ ] Set `PG_POOL_MAX`.
- [ ] Set `BIDAYAX_IP_HASH_SECRET` to the owner-supplied production secret.
- [ ] Set `APP_BASE_URL=https://theexecutivecard.online`.
- [ ] Set `CARD_BASE_URL=https://theexecutivecard.online`.
- [ ] Set `DASHBOARD_BASE_URL` to the approved dashboard URL.
- [ ] Keep telephony and voice safety flags disabled for RC1 unless a later release changes scope.
- [ ] Set `POSTGRES_PASSWORD` to the owner-supplied production secret in the VPS `.env.production` or deployment shell.
- [ ] Set Caddy admin email to `support@theexecutivecard.online` or another owner-approved mailbox.
- [ ] Set `CARD_DOMAIN=theexecutivecard.online`.
- [ ] Set `DASHBOARD_DOMAIN=dashboard.theexecutivecard.online`.

## 7. Docker And Database

- [ ] Use Docker Compose project name `the-executive-card`.
- [ ] Use project-specific loopback ports `127.0.0.1:3100:3000` and `127.0.0.1:3101:3001`.
- [ ] Confirm no other process uses ports `3100` or `3101`.
- [ ] Confirm `docker compose -p the-executive-card -f infrastructure/docker/docker-compose.hostinger.yml config` succeeds.
- [ ] Build containers with `docker compose -p the-executive-card -f infrastructure/docker/docker-compose.hostinger.yml build`.
- [ ] Start Postgres, card, and dashboard with `docker compose -p the-executive-card -f infrastructure/docker/docker-compose.hostinger.yml up -d`.
- [ ] Confirm containers are healthy/running with `docker compose -p the-executive-card -f infrastructure/docker/docker-compose.hostinger.yml ps`.
- [ ] Run migration verification with `pnpm db:migrations:verify`.
- [ ] Run database connection check with production `DATABASE_URL`.
- [ ] Run service smoke checks that require `DATABASE_URL` after migrations are applied.

## 8. Caddy And SSL

- [x] Caddy runtime decision: host-level Caddy.
- [ ] Install Caddy on Ubuntu 24.04.
- [ ] Configure Caddy environment variables.
- [ ] Do not overwrite Caddy configuration for other VPS projects.
- [ ] Create `/etc/caddy/sites-enabled/the-executive-card.caddy`.
- [ ] Ensure the main `/etc/caddy/Caddyfile` imports `/etc/caddy/sites-enabled/*.caddy`.
- [ ] Use the host-level Caddyfile from `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`, which proxies to `127.0.0.1:3100` and `127.0.0.1:3101`.
- [ ] Generate dashboard basic-auth hash with `caddy hash-password`.
- [ ] Confirm dashboard requires basic auth before showing any page or API response.
- [ ] Confirm Caddy obtains HTTPS certificates.
- [ ] Confirm HTTPS works for card and dashboard domains.
- [ ] Confirm HSTS header is present in production responses.

## 9. Health And Readiness

- [ ] Verify `https://dashboard.theexecutivecard.online/api/system/health`.
- [ ] Verify `https://dashboard.theexecutivecard.online/api/system/readiness`.
- [ ] Confirm readiness reports database ready after migrations.
- [ ] Confirm voice safety remains blocked/default safe.

## 10. Production Card Validation

- [ ] Verify `https://theexecutivecard.online/card/ad-garner`.
- [ ] Verify `https://theexecutivecard.online/card/naimah-barnes`.
- [ ] Verify `https://theexecutivecard.online/card/sean-hall`.
- [ ] Verify QR image routes for all three.
- [ ] Verify vCard routes for all three.
- [ ] Verify call links.
- [ ] Verify email links.
- [ ] Verify website links.
- [ ] Verify share actions on iPhone and Android.
- [ ] Verify OpenGraph metadata.
- [ ] Verify event ingestion persists to PostgreSQL.

## 11. Backups And Restore

- [ ] Confirm backup directory location.
- [ ] Run `pwsh infrastructure/hostinger-vps/BACKUP.ps1 -OutputPath /opt/the-executive-card/backups/the-executive-card-YYYYMMDD-HHMMSS.dump` with production `DATABASE_URL`.
- [ ] Store backup under `/opt/the-executive-card/backups` or another owner-approved path outside the Postgres volume.
- [ ] Perform a restore drill in a non-production environment before launch.
- [ ] Document backup retention.

## 12. Monitoring And Logs

- [ ] Confirm Docker logs for `card`, `dashboard`, and `postgres`.
- [ ] Confirm Caddy access/error logs.
- [ ] Confirm dashboard observability routes work after database connection.
- [ ] Define alerting outside the repository if needed; no alert provider is configured in the current codebase.

## 13. Stop Condition

Stop deployment work if any of these are unknown:

- Production `DATABASE_URL`.
- Full Namecheap DKIM value.
- Dashboard basic-auth username/password hash.
