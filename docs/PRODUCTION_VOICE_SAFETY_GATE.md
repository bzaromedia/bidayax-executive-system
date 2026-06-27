# Production Voice Safety Gate

Production voice may only be considered allowed when all Phase 10 gate
conditions pass.

## Required Conditions

- `TELEPHONY_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID` exists.
- `TWILIO_AUTH_TOKEN` exists.
- `TWILIO_PHONE_NUMBER` exists.
- `OPENAI_API_KEY` exists.
- `OPENAI_REALTIME_MODEL` exists.
- `VOICE_AGENT_ENABLED=true`
- `VOICE_TEST_MODE=false`
- `LIVE_INBOUND_CALLS_ENABLED=true`
- `ALLOW_PRODUCTION_CALLS=true`
- Human approval policy is satisfied.

Outbound calling additionally requires:

- `OUTBOUND_CALLS_ENABLED=true`
- An approved outbound call request.
- `approval_status=approved`
- `status=approved` or `ready_for_provider`

## Blocked By Default

The default state is intentionally blocked:

- Mock provider.
- Test mode enabled.
- Voice agent disabled.
- Live inbound disabled.
- Outbound disabled.
- Production calls disabled.
- Human approval required.

## Data Protection

The safety gate does not store:

- Secrets.
- Raw audio.
- Call recordings.
- Payment data.
- Raw IP addresses.
- Enriched identity data.

