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
## Phase 9 Tests

Phase 9 adds tests for explicit consent denial, missing recording consent, raw-audio retention blocking, link/email/phone/secret redaction, and combined conversation safety validation before runtime tool execution.

## Phase 9G Tests

Phase 9G adds adversarial tests for missing voice consent before transcript capture, sensitive tool consent gating, obfuscated email redaction, Unicode-normalized phone redaction, bearer/token/credential redaction, oversized preview bounds, and audit metadata excluding raw sensitive input.
