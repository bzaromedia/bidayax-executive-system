# Live Provider Integration + Voice Runtime Safety Gate

Phase 10 connects BidayaX Executive System to provider-compatible live
integration surfaces while keeping production voice behavior blocked by
default.

## What Exists

- Twilio-compatible provider adapter.
- Twilio-shaped inbound webhook normalization.
- Safe TwiML response generation.
- Twilio webhook signature validation structure.
- OpenAI Realtime readiness validation.
- Voice runtime readiness records.
- Dashboard live-readiness panels.
- Production and outbound safety gates.

## What Does Not Exist Yet

- No unrestricted outbound calling.
- No autonomous voice receptionist.
- No live OpenAI Realtime audio streaming.
- No real email sending.
- No calendar booking.
- No CRM pipeline.
- No payment collection.
- No contact enrichment.

## Safe Defaults

```text
TELEPHONY_PROVIDER=mock
TWILIO_WEBHOOK_SIGNING_ENABLED=false
VOICE_AGENT_ENABLED=false
VOICE_RUNTIME_PROVIDER=none
VOICE_TEST_MODE=true
LIVE_INBOUND_CALLS_ENABLED=false
OUTBOUND_CALLS_ENABLED=false
REQUIRE_HUMAN_APPROVAL=true
ALLOW_PRODUCTION_CALLS=false
```

With these defaults, provider configuration can be checked and webhook shapes can
be validated, but production voice remains blocked.

## Provider Readiness

Provider readiness checks evaluate whether the configured environment is ready
for mock, Twilio, and OpenAI Realtime workflows. Checks only record non-secret
status and explanation data.

Readiness statuses:

- `passed`
- `failed`
- `warning`
- `skipped`

Secrets are never stored in `provider_readiness_checks` and are never returned
by the readiness API.

## Voice Runtime Readiness

OpenAI Realtime is readiness-checked only in Phase 10. The system validates:

- `OPENAI_API_KEY` exists.
- `OPENAI_REALTIME_MODEL` exists.
- `VOICE_RUNTIME_PROVIDER=openai_realtime`.
- `VOICE_AGENT_ENABLED=true`.
- `VOICE_TEST_MODE` is still respected.
- `ALLOW_PRODUCTION_CALLS` is explicitly set before production approval.

No live Realtime audio stream is created in Phase 10.

## Safety Gates

Production voice is only considered allowed when all required provider,
runtime, inbound, approval, and production flags pass. Missing configuration or
unsafe defaults return reason codes rather than silently proceeding.

Common reason codes:

- `PROVIDER_NOT_TWILIO`
- `TWILIO_CONFIG_MISSING`
- `OPENAI_CONFIG_MISSING`
- `VOICE_AGENT_DISABLED`
- `TEST_MODE_ENABLED`
- `LIVE_INBOUND_DISABLED`
- `PRODUCTION_CALLS_DISABLED`
- `OUTBOUND_CALLS_DISABLED`
- `HUMAN_APPROVAL_REQUIRED`
- `OUTBOUND_REQUEST_NOT_APPROVED`
- `WEBHOOK_SIGNATURE_REQUIRED`
- `MALFORMED_PROVIDER_PAYLOAD`

## TwiML Behavior

The Twilio inbound route returns safe TwiML with a short message and `<Hangup/>`.
In test mode, it may include a simple `<Gather>` for keypad testing. It does
not start autonomous conversation, scheduling, email, or follow-up behavior.

