# Telephony Safety Model

## Core Safety Rules

Phase 9 defaults are intentionally conservative:

- `TELEPHONY_PROVIDER=mock`
- `OUTBOUND_CALLS_ENABLED=false`
- `VOICE_AGENT_ENABLED=false`
- `REQUIRE_HUMAN_APPROVAL=true`

## Outbound Call Gate

An outbound request cannot become provider-ready unless:

- outbound calls are enabled.
- human approval is satisfied when required.
- the provider is allowed for the current phase.

Phase 9 still blocks real provider execution.

## Voice Agent Gate

Voice sessions are metadata only. Phase 9 does not stream audio, invoke OpenAI Realtime, or run a live AI voice agent.

## Privacy

Phase 9 does not store raw recordings, raw audio, payment data, contact enrichment, or inferred identity. Dashboard phone numbers are masked.

## Future Provider Activation

Future phases must add provider-specific validation, test-call mode, rollback procedures, human approval review, logging review, and explicit deployment flags before any live calling is enabled.
