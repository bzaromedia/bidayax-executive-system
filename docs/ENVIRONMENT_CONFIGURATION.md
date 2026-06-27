# Environment Configuration

Use `.env.example` for local development and `.env.production.example` as the
production template.

## Required Production Values

- `NODE_ENV=production`
- `DATABASE_URL`
- `APP_BASE_URL`
- `DASHBOARD_BASE_URL`
- `CARD_BASE_URL`

## Provider Values

Twilio values are required only when `TELEPHONY_PROVIDER=twilio`.

OpenAI Realtime values are required only when
`VOICE_RUNTIME_PROVIDER=openai_realtime`.

## Safe Defaults

- `TELEPHONY_PROVIDER=mock`
- `VOICE_AGENT_ENABLED=false`
- `VOICE_RUNTIME_PROVIDER=none`
- `VOICE_TEST_MODE=true`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `REQUIRE_HUMAN_APPROVAL=true`
- `ALLOW_PRODUCTION_CALLS=false`

## Validation

```bash
pnpm verify:production
```

The validation result reports missing values without printing secrets.

