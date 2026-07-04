# Environment Variables

Project: The Executive Card™  
Deployment target: Hostinger VPS

Production choices:

- Hostinger VPS IPv4: `187.124.251.190`
- Hostinger OS/version: Ubuntu 24.04 with Docker
- PostgreSQL: Compose-managed Postgres
- Caddy: host-level Caddy
- Dashboard: password-protected `dashboard.theexecutivecard.online`
- Email: Namecheap Private Email for inboxes
- Transactional email: Resend deferred until application-sent email exists
- Isolation: deploy under `/opt/the-executive-card`, run Compose with `-p the-executive-card`, bind apps to `127.0.0.1:3100` and `127.0.0.1:3101`

Real secret values must be stored only in the VPS `.env.production` or server environment. Do not commit real `POSTGRES_PASSWORD` or `BIDAYAX_IP_HASH_SECRET` values.

## Runtime Variables

| Variable | Required? | Default | Description | Production Source |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Yes | `development` in local example; `production` in production example | Selects runtime mode and production validation behavior | `.env.production` |
| `DATABASE_URL` | Yes for production | Empty locally; example points to Docker Postgres | PostgreSQL connection string used by card event ingestion, dashboard queries, services, scripts, backup, and restore | `.env.production`, generated from chosen PostgreSQL deployment |
| `DATABASE_SSL` | Conditional | `false` | Enables PostgreSQL SSL client option when set to `true` | `.env.production`; depends on database topology |
| `PG_POOL_MAX` | No | `5` local, `10` production example | PostgreSQL pool max for app/service clients | `.env.production` |
| `BIDAYAX_IP_HASH_SECRET` | Yes for production privacy | Placeholder in examples | HMAC secret for hashing request IP addresses in event ledger | Secret manager or server-only `.env.production` |
| `IP_HASH_SECRET` | No | None | Legacy/fallback IP hash secret if `BIDAYAX_IP_HASH_SECRET` is absent | Avoid using unless needed for compatibility |
| `APP_BASE_URL` | Yes for production | Localhost in local example | Allowed origin and public app base URL | `.env.production`; expected `https://theexecutivecard.online` |
| `CARD_BASE_URL` | Yes for production | Localhost in local example | Allowed origin and public card base URL | `.env.production`; expected `https://theexecutivecard.online` |
| `DASHBOARD_BASE_URL` | Yes for production if dashboard is deployed | Localhost in local example | Allowed origin and dashboard base URL | `.env.production`; expected `https://dashboard.theexecutivecard.online` |

## Telephony And Voice Safety Variables

These are present for safety-gated future integration. The current v1.0 release should keep live provider behavior disabled unless a separate production telephony implementation and approval process is completed.

| Variable | Required? | Default | Description | Production Source |
| --- | --- | --- | --- | --- |
| `TELEPHONY_PROVIDER` | No | `mock` | Selects `mock` or `twilio` provider boundary | `.env.production`; keep `mock` for RC1 |
| `TWILIO_ACCOUNT_SID` | Conditional | Empty | Required only if `TELEPHONY_PROVIDER=twilio` | Twilio console, not required for RC1 mock mode |
| `TWILIO_AUTH_TOKEN` | Conditional | Empty | Required only if `TELEPHONY_PROVIDER=twilio` | Twilio console, not required for RC1 mock mode |
| `TWILIO_PHONE_NUMBER` | Conditional | Empty | Required only if `TELEPHONY_PROVIDER=twilio` | Twilio console, not required for RC1 mock mode |
| `TWILIO_WEBHOOK_SIGNING_ENABLED` | Conditional | `false` | Must be `true` for production Twilio webhooks | `.env.production`; keep `false` in mock mode |
| `OPENAI_API_KEY` | Conditional | Empty | Required only if `VOICE_RUNTIME_PROVIDER=openai_realtime` | OpenAI account, not required for RC1 safety-gated mode |
| `OPENAI_REALTIME_MODEL` | Conditional | Empty | Required only if OpenAI Realtime voice runtime is selected | OpenAI account, not required for RC1 safety-gated mode |
| `DEEPGRAM_API_KEY` | Conditional | Empty | Required only if a speech-to-text provider adapter is enabled | Provider account, not required for RC1 safety-gated mode |
| `ELEVENLABS_API_KEY` | Conditional | Empty | Required only if a text-to-speech provider adapter is enabled | Provider account, not required for RC1 safety-gated mode |
| `DEFAULT_RECEPTIONIST_LANGUAGE` | No | `English` | Default language for the receptionist workflow when detection safely defaults | `.env.production` |
| `VOICE_RECORDING_DISCLOSURE_ENABLED` | Conditional | `false` | Controls recording disclosure policy for live voice workflows | `.env.production`; must be configured before live calling |
| `CALL_TRANSFER_ENABLED` | No | `false` | Enables live call transfer only after provider validation and owner approval | `.env.production`; keep `false` for RC1 |
| `VOICE_AGENT_ENABLED` | No | `false` | Voice agent execution gate | `.env.production`; keep `false` for RC1 |
| `VOICE_RUNTIME_PROVIDER` | No | `none` | Selects voice runtime provider | `.env.production`; keep `none` for RC1 |
| `VOICE_TEST_MODE` | No | `true` | Keeps voice runtime in test mode | `.env.production`; keep `true` for RC1 |
| `LIVE_INBOUND_CALLS_ENABLED` | No | `false` | Live inbound call gate | `.env.production`; keep `false` for RC1 |
| `OUTBOUND_CALLS_ENABLED` | No | `false` | Outbound call gate | `.env.production`; keep `false` for RC1 |
| `REQUIRE_HUMAN_APPROVAL` | No | `true` | Requires human approval for outbound flow | `.env.production`; keep `true` |
| `HUMAN_APPROVAL_REQUIRED` | No | `true` | Alias accepted for `REQUIRE_HUMAN_APPROVAL` | `.env.production`; keep `true` |
| `ALLOW_PRODUCTION_CALLS` | No | `false` | Final production call execution gate | `.env.production`; keep `false` for RC1 |

## Docker Compose Variables

| Variable | Required? | Default | Description | Production Source |
| --- | --- | --- | --- | --- |
| `POSTGRES_DB` | No | `bidayax` | Database name for Docker Postgres container | Server environment or compose invocation |
| `POSTGRES_USER` | No | `bidayax` | Database user for Docker Postgres container | Server environment or compose invocation |
| `POSTGRES_PASSWORD` | Yes | None | Required by compose; Postgres container will not start without it | Secret manager or server environment |

## Caddy Variables

| Variable | Required? | Default | Description | Production Source |
| --- | --- | --- | --- | --- |
| `CADDY_ADMIN_EMAIL` | Yes if using provided Caddyfile | None | ACME/certificate administration email | Owner-supplied mailbox |
| `CARD_DOMAIN` | Yes if using provided Caddyfile | None | Domain routed to `card:3000` | Expected `theexecutivecard.online` |
| `DASHBOARD_DOMAIN` | Yes if using provided Caddyfile | None | Domain routed to `dashboard:3001` | Expected `dashboard.theexecutivecard.online` |

## Variables Not Found In Current Runtime

These commonly requested variables were not found in active app/service runtime code:

| Variable | Status |
| --- | --- |
| `REDIS_URL` | Not used |
| `S3_BUCKET` / object storage variables | Not used |
| `SMTP_HOST`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD` | Not used |
| `NEXTAUTH_SECRET` | Not used |
| `SESSION_SECRET` | Not used |
| `POSTHOG_KEY` | Not used |
| `STRIPE_SECRET_KEY` | Not used |
| `LEMON_SQUEEZY_*` | Not used |

## Production `.env.production` Template

Create this file on the VPS only. Do not commit it.

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
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
DEFAULT_RECEPTIONIST_LANGUAGE=English
VOICE_RECORDING_DISCLOSURE_ENABLED=false
CALL_TRANSFER_ENABLED=false
VOICE_AGENT_ENABLED=false
VOICE_RUNTIME_PROVIDER=none
VOICE_TEST_MODE=true
LIVE_INBOUND_CALLS_ENABLED=false
OUTBOUND_CALLS_ENABLED=false
REQUIRE_HUMAN_APPROVAL=true
HUMAN_APPROVAL_REQUIRED=true
ALLOW_PRODUCTION_CALLS=false
```

The owner supplied `POSTGRES_PASSWORD` and `BIDAYAX_IP_HASH_SECRET` out-of-band. They are intentionally not printed here.

## Project Isolation Environment Notes

Do not reuse another project's `.env`, Docker Compose project name, database volume, Caddy site file, or backup directory.

Use these project-specific values during live deployment:

| Setting | Value |
| --- | --- |
| VPS project directory | `/opt/the-executive-card` |
| Docker Compose project name | `the-executive-card` |
| Card host loopback port | `127.0.0.1:3100` |
| Dashboard host loopback port | `127.0.0.1:3101` |
| Caddy site file | `/etc/caddy/sites-enabled/the-executive-card.caddy` |
| Backup directory | `/opt/the-executive-card/backups` |
