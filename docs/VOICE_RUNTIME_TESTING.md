# Voice Runtime Testing

## Focused Tests

`@bidayax/receptionist-runtime` tests cover:

- valid state transitions
- impossible transition rejection
- mock STT behavior
- deterministic mock TTS references
- language detection and fallback
- intent classification
- tool planning
- end-to-end text turn orchestration
- sensitive request escalation

## Provider Status

All runtime tests use mock providers only. No live provider credentials are required.

## Future Tests

Future provider phases must add provider-specific contract tests, media-stream tests, consent tests, red-team prompt-injection tests, PII redaction tests, and production kill-switch tests before activation.