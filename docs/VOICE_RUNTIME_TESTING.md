# Voice Runtime Testing

## Focused Tests

`@bidayax/receptionist-runtime` tests cover:

- valid state transitions
- impossible transition rejection
- mock STT behavior
- deterministic mock TTS references
- supported language detection and fallback
- intent classification
- tool planning
- end-to-end text turn orchestration
- prompt-injection blocking
- emergency escalation
- sensitive transcript preview redaction
- replay rejection
- missing tenant/card/session scope failure

## Provider Status

All runtime tests use mock providers only. No live provider credentials are required.

## Future Tests

Future provider phases must add provider-specific contract tests, media-stream tests, consent tests, red-team prompt-injection tests, PII redaction tests, retention tests, and production kill-switch tests before activation.