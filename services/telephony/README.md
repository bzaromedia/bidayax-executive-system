# BidayaX Telephony Service

Phase 9 creates the Live Voice + Telephony Integration Preparation layer.
Phase 10 adds the Live Provider Integration + Voice Runtime Safety Gate.

## Commands

```bash
pnpm --filter @bidayax/telephony test
pnpm --filter @bidayax/telephony build
```

## Safety Defaults

- `TELEPHONY_PROVIDER=mock`
- `TWILIO_WEBHOOK_SIGNING_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `VOICE_AGENT_ENABLED=false`
- `VOICE_RUNTIME_PROVIDER=none`
- `VOICE_TEST_MODE=true`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `REQUIRE_HUMAN_APPROVAL=true`
- `ALLOW_PRODUCTION_CALLS=false`

## Scope

This service defines provider interfaces, mock provider behavior, inbound webhook normalization, outbound call request preparation, call lifecycle transitions, voice session drafts, and safety gates. Phase 10 also defines Twilio-compatible provider readiness, Twilio-shaped webhook validation, safe TwiML generation, OpenAI Realtime readiness checks, test-call mode, and production voice reason codes.

It does not make unrestricted real calls, start OpenAI Realtime sessions, stream audio, send email, book calendars, or execute autonomous production voice behavior.
