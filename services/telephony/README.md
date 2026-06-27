# BidayaX Telephony Service

Phase 9 creates the Live Voice + Telephony Integration Preparation layer.

## Commands

```bash
pnpm --filter @bidayax/telephony test
pnpm --filter @bidayax/telephony build
```

## Safety Defaults

- `TELEPHONY_PROVIDER=mock`
- `OUTBOUND_CALLS_ENABLED=false`
- `VOICE_AGENT_ENABLED=false`
- `REQUIRE_HUMAN_APPROVAL=true`

## Scope

This service defines provider interfaces, mock provider behavior, inbound webhook normalization, outbound call request preparation, call lifecycle transitions, voice session drafts, and safety gates.

It does not make real calls, connect Twilio, connect OpenAI Realtime, stream audio, send email, book calendars, or execute autonomous production voice behavior.
