# Environment Variables

Project: The Executive Card™  
Deployment target: Dedicated Hostinger VPS

Canonical production secret path:

```text
/opt/the-executive-card/shared/env/production.env
```

Requirements:

- owner: `root`
- mode: `0600`
- outside the repository
- not copied into release directories
- not committed
- not printed in logs
- excluded from normal application backups

## Core Runtime Variables

| Variable | Required | Production guidance |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | PostgreSQL application connection string |
| `DATABASE_SSL` | Conditional | `false` for the initial internal PostgreSQL deployment unless topology changes |
| `PG_POOL_MAX` | Yes | Keep explicit; default production target is `10` |
| `APP_BASE_URL` | Yes | `https://theexecutivecard.online` |
| `CARD_BASE_URL` | Yes | `https://theexecutivecard.online` |
| `DASHBOARD_BASE_URL` | Yes | `https://dashboard.theexecutivecard.online` |
| `NEXT_PUBLIC_DASHBOARD_BASE_URL` | Yes for card UI links | `https://dashboard.theexecutivecard.online` |
| `BIDAYAX_IP_HASH_SECRET` | Yes | server-only secret |

## Identity Variables

| Variable | Required | Production guidance |
| --- | --- | --- |
| `WORKOS_CLIENT_ID` | Yes | WorkOS application client id |
| `WORKOS_API_KEY` | Yes | server-only secret |
| `WORKOS_WEBHOOK_SECRET` | Yes | server-only secret |
| `WORKOS_REDIRECT_URI` | Yes | `https://dashboard.theexecutivecard.online/auth/callback` |
| `WORKOS_ISSUER` | Yes | `https://api.workos.com/` unless WorkOS guidance changes |
| `WORKOS_JWKS_URL` | Conditional | explicit only when required by the identity configuration |
| `IDENTITY_TRANSACTION_ENCRYPTION_KEY` | Yes | minimum 32 characters; server-only secret |
| `IDENTITY_SECURE_COOKIES` | Yes | must be `true` in production |
| `IDENTITY_ALLOWED_REDIRECT_ORIGINS` | Yes | exact origins only; no wildcards |
| `IDENTITY_ALLOWED_AUDIENCE` | Conditional | defaults to WorkOS client id unless overridden deliberately |
| `IDENTITY_COOKIE_DOMAIN` | Conditional | `.theexecutivecard.online` when cross-subdomain cookies are required |
| `IDENTITY_SESSION_IDLE_SECONDS` | Yes | explicit production value |
| `IDENTITY_SESSION_ABSOLUTE_SECONDS` | Yes | explicit production value |
| `IDENTITY_CLOCK_SKEW_SECONDS` | Yes | explicit production value |

## Communications Safety Variables

These must remain disabled for the current production scope.

| Variable | Required | Production value |
| --- | --- | --- |
| `TELEPHONY_PROVIDER` | Yes | `mock` |
| `TELEPHONY_PROVIDER_MODE` | Yes | `disabled` |
| `VOICE_RUNTIME_PROVIDER` | Yes | `none` |
| `VOICE_AGENT_ENABLED` | Yes | `false` |
| `VOICE_TEST_MODE` | Yes | `true` |
| `LIVE_INBOUND_CALLS_ENABLED` | Yes | `false` |
| `OUTBOUND_CALLS_ENABLED` | Yes | `false` |
| `REQUIRE_HUMAN_APPROVAL` | Yes | `true` |
| `ALLOW_PRODUCTION_CALLS` | Yes | `false` |
| `VOICE_RECORDING_DISCLOSURE_ENABLED` | Yes | `false` |
| `CALL_TRANSFER_ENABLED` | Yes | `false` |

Additional provider secrets remain unset unless a later approved activation phase changes scope.

## Email Variables

| Variable | Required | Current production meaning |
| --- | --- | --- |
| `EMAIL_HOST` | Conditional | used only to determine whether receptionist notification email is configured |
| `EMAIL_USERNAME` | Conditional | used only to determine whether receptionist notification email is configured |
| `EMAIL_PASSWORD` | Conditional | used only to determine whether receptionist notification email is configured |

Current runtime evidence:

- `apps/card/src/lib/receptionist-notification.ts` checks these variables to report `email_ready` versus `provider_unconfigured`.
- The current repository does not implement a full SMTP sending pipeline in this phase.

## PostgreSQL Container Variables

| Variable | Required | Production guidance |
| --- | --- | --- |
| `POSTGRES_DB` | Yes | explicit value, default `bidayax` |
| `POSTGRES_USER` | Yes | explicit value, default `bidayax` |
| `POSTGRES_PASSWORD` | Yes | server-only secret |
| `MIGRATION_DATABASE_URL` | Deferred | may be added later to separate migration credentials from the app role |

## Release And Proxy Variables

| Variable | Required | Production guidance |
| --- | --- | --- |
| `CADDY_ADMIN_EMAIL` | Required when rendering the generic Caddy template | owner-approved mailbox |
| `CARD_DOMAIN` | Optional generic template input | `theexecutivecard.online` |
| `DASHBOARD_DOMAIN` | Optional generic template input | `dashboard.theexecutivecard.online` |

## Template Rules

- `.env.production.example` is a names-only repository template.
- Real values live only in `/opt/the-executive-card/shared/env/production.env`.
- Do not commit real values.
- Do not copy real values into release artifacts.
