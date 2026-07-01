# Production Deployment Runbook

Project: The Executive Card™  
Deployment target: Hostinger VPS  
VPS IPv4: `187.124.251.190`  
VPS OS/version: Ubuntu 24.04 with Docker  
DNS/email provider: Namecheap  
Caddy runtime: host-level Caddy  
PostgreSQL plan: Compose-managed Postgres

## Stop Conditions

Do not execute live deployment until:

- Namecheap DNS A records are configured.
- Namecheap Private Email MX/SPF records are configured.
- Exact full Namecheap DKIM TXT value is copied and configured.
- `POSTGRES_PASSWORD` is available on the VPS without committing it.
- `BIDAYAX_IP_HASH_SECRET` is available on the VPS without committing it.
- Dashboard basic-auth username and password are selected.

## Isolation Rules

This VPS may host other projects. Keep The Executive Card isolated:

- Use project directory `/opt/the-executive-card`.
- Use Docker Compose project name `the-executive-card`.
- Use localhost-only host ports `127.0.0.1:3100` for card and `127.0.0.1:3101` for dashboard.
- Use a dedicated Caddy site file: `/etc/caddy/sites-enabled/the-executive-card.caddy`.
- Do not overwrite another project's Caddyfile.
- Do not reuse another project's Docker network, volume, ports, backup directory, or environment file.
- Keep PostgreSQL private to the Docker network.

## Namecheap DNS Records

Enter these records in Namecheap:

| Type | Host | Value | TTL | Notes |
| --- | --- | --- | --- | --- |
| A | `@` | `187.124.251.190` | Automatic | Apex production card app |
| A | `dashboard` | `187.124.251.190` | Automatic | Password-protected dashboard |
| CNAME | `www` | `@` | Automatic | Optional; only if using the `www` redirect block below |
| MX | `@` | `mx1.privateemail.com` | Automatic | Priority `10` |
| MX | `@` | `mx2.privateemail.com` | Automatic | Priority `10` |
| TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` | Automatic | Namecheap Private Email SPF |
| TXT | `privateemail._domainkey` | Copy exact full DKIM value from Namecheap | Automatic | Screenshot is truncated; do not retype from screenshot |
| TXT | `_dmarc` | `v=DMARC1; p=none` | Automatic | Launch monitoring policy |

## Namecheap Mailboxes

Create these inboxes or aliases in Namecheap Private Email:

- `contact@theexecutivecard.online`
- `support@theexecutivecard.online`
- `sales@theexecutivecard.online`
- `hello@theexecutivecard.online`
- `notifications@theexecutivecard.online`
- `noreply@theexecutivecard.online`

The current app still uses `contact@bidayax.com` in card profile data. Switching production cards to `contact@theexecutivecard.online` is a separate code/data change and test update.

## VPS Directory Layout

Use:

```bash
sudo mkdir -p /opt/the-executive-card
sudo mkdir -p /opt/the-executive-card/backups
sudo chown -R "$USER":"$USER" /opt/the-executive-card
```

Clone or copy the repository into:

```text
/opt/the-executive-card/repo
```

## Production Environment File

Create this on the VPS only:

```text
/opt/the-executive-card/repo/.env.production
```

Template:

```dotenv
NODE_ENV=production

POSTGRES_DB=bidayax
POSTGRES_USER=bidayax
POSTGRES_PASSWORD=<OWNER_SUPPLIED_POSTGRES_PASSWORD>

DATABASE_URL=postgres://bidayax:<OWNER_SUPPLIED_POSTGRES_PASSWORD>@postgres:5432/bidayax
DATABASE_SSL=false
PG_POOL_MAX=10
BIDAYAX_IP_HASH_SECRET=<OWNER_SUPPLIED_BIDAYAX_IP_HASH_SECRET>

APP_BASE_URL=https://theexecutivecard.online
CARD_BASE_URL=https://theexecutivecard.online
DASHBOARD_BASE_URL=https://dashboard.theexecutivecard.online

TELEPHONY_PROVIDER=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_SIGNING_ENABLED=false

OPENAI_API_KEY=
OPENAI_REALTIME_MODEL=
VOICE_AGENT_ENABLED=false
VOICE_RUNTIME_PROVIDER=none
VOICE_TEST_MODE=true
LIVE_INBOUND_CALLS_ENABLED=false
OUTBOUND_CALLS_ENABLED=false
REQUIRE_HUMAN_APPROVAL=true
ALLOW_PRODUCTION_CALLS=false
```

The owner supplied the real `POSTGRES_PASSWORD` and `BIDAYAX_IP_HASH_SECRET` out-of-band. Do not commit them.

## Hostinger Docker Compose File

Use the repository Hostinger Compose file:

```text
/opt/the-executive-card/repo/infrastructure/docker/docker-compose.hostinger.yml
```

This file is intentionally standalone. Do not combine it with `docker-compose.production.yml`, because the base production file publishes `3000:3000` and `3001:3001`. The Hostinger file binds only project-specific loopback ports:

- `127.0.0.1:3100:3000` for the card app.
- `127.0.0.1:3101:3001` for the dashboard.

Validate it with:

```bash
docker compose \
  -p the-executive-card \
  -f infrastructure/docker/docker-compose.hostinger.yml \
  config
```

## Host-Level Caddy Plan

Install Caddy on Ubuntu 24.04 using the host-level package method approved for the VPS.

Create:

```text
/etc/caddy/sites-enabled/the-executive-card.caddy
```

Use this site file:

```caddy
theexecutivecard.online {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3100
}

www.theexecutivecard.online {
	redir https://theexecutivecard.online{uri} permanent
}

dashboard.theexecutivecard.online {
	encode zstd gzip

	basicauth {
		<OWNER_SELECTED_DASHBOARD_USERNAME> <CADDY_HASHED_DASHBOARD_PASSWORD>
	}

	reverse_proxy 127.0.0.1:3101
}
```

Ensure the main Caddyfile imports site files without replacing other projects:

```caddy
{
	email support@theexecutivecard.online
}

import /etc/caddy/sites-enabled/*.caddy
```

If the VPS already has a main Caddyfile for other projects, add only the `import` line if it is missing. Do not delete existing site blocks.

Generate the dashboard password hash on the VPS:

```bash
caddy hash-password
```

Paste the generated hash into the dashboard `basicauth` block. Do not commit the dashboard password or hash.

Validate and reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Build And Start Commands

From:

```bash
cd /opt/the-executive-card/repo
```

Run:

```bash
pnpm install
pnpm db:migrations:verify
pnpm verify:production

docker compose \
  -p the-executive-card \
  -f infrastructure/docker/docker-compose.hostinger.yml \
  build

docker compose \
  -p the-executive-card \
  -f infrastructure/docker/docker-compose.hostinger.yml \
  up -d

docker compose \
  -p the-executive-card \
  -f infrastructure/docker/docker-compose.hostinger.yml \
  ps
```

## Migration And Database Commands

The repository currently verifies migration ordering with:

```bash
pnpm db:migrations:verify
```

Database-backed checks require `DATABASE_URL` in the environment:

```bash
pnpm db:check
pnpm telemetry:verify
pnpm improvement:verify
```

The current repository does not include an automated migration-apply command. Apply SQL files in `database/migrations` to the production database using the approved PostgreSQL migration method before public launch, then run readiness checks.

## Backup Command

With production `DATABASE_URL` available:

```bash
pwsh infrastructure/hostinger-vps/BACKUP.ps1 \
  -OutputPath /opt/the-executive-card/backups/the-executive-card-$(date +%Y%m%d-%H%M%S).dump
```

## Restore Command

Restore is destructive. Use only after taking a fresh backup and confirming the target:

```bash
pwsh scripts/restore-database.ps1 \
  -BackupPath /opt/the-executive-card/backups/<backup-file>.dump \
  -ConfirmRestore
```

## Health Checks

After Docker and Caddy are running:

```bash
curl -I https://theexecutivecard.online/card/ad-garner
curl -I https://theexecutivecard.online/card/naimah-barnes
curl -I https://theexecutivecard.online/card/sean-hall
curl -I https://theexecutivecard.online/card/ad-garner/qr
curl -I https://theexecutivecard.online/card/ad-garner/vcard
curl -I https://dashboard.theexecutivecard.online/api/system/health
```

The dashboard health request must require basic auth.

## Public Card Acceptance

Validate all three cards on the public internet:

- `https://theexecutivecard.online/card/ad-garner`
- `https://theexecutivecard.online/card/naimah-barnes`
- `https://theexecutivecard.online/card/sean-hall`

Check:

- HTTPS certificate.
- HSTS/security headers.
- QR image route.
- vCard route.
- Call link.
- Email link.
- Website link.
- Share action.
- OpenGraph metadata.
- Event ingestion persisted to PostgreSQL.

## Deployment Readiness Status

READY FOR HOSTINGER CONFIGURATION

B4 may proceed to live deployment execution only after:

- The full Namecheap DKIM TXT value is copied into DNS.
- Dashboard basic-auth username/password hash is generated.
- The owner confirms it is acceptable to execute deployment commands on the VPS.
