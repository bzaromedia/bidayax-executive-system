# OpenAI Realtime Voice Runtime Guide

Phase 10 readiness-checks OpenAI Realtime configuration only. It does not create
or stream a live realtime audio session.

## Environment Variables

```text
OPENAI_API_KEY=
OPENAI_REALTIME_MODEL=
VOICE_AGENT_ENABLED=false
VOICE_RUNTIME_PROVIDER=none
VOICE_TEST_MODE=true
ALLOW_PRODUCTION_CALLS=false
```

## Readiness Requirements

The system checks:

- API key presence.
- Realtime model presence.
- Runtime provider selection.
- Voice agent flag.
- Test mode.
- Production call approval flag.

## What Is Blocked

- No WebRTC session is created.
- No WebSocket session is created.
- No SIP voice runtime is activated.
- No audio is streamed.
- No autonomous receptionist conversation is active.

## Future Activation

Future phases may add a real voice runtime only after:

- Provider credentials are configured.
- Twilio signature validation is enabled for production.
- Test-call mode passes.
- Human approval policy is satisfied.
- Rollback and monitoring are in place.

