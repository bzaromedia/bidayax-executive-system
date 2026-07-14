# Voice Runtime Security

## Safety Controls

Phase 8G keeps the voice runtime provider-neutral and mock-only. Sensitive requests such as contract approval, payment, legal advice, medical claims, guarantees, or financial promises are routed to human approval instead of producing a commitment.

## Prompt-Injection Resistance

The runtime blocks attempts to override system instructions, reveal internal prompts, bypass policy, or act as an unrestricted agent. Blocked turns enter the `blocked` terminal state and use `blocked_by_policy` provider status.

## Emergency Awareness

Emergency language is escalated to human review without claiming emergency-service dispatch, live calling, or guaranteed response. The runtime response instructs users in immediate danger to contact local emergency services.

## Tenant And Card Scope

Every runtime turn requires `tenantId`, `cardId`, and `sessionId`. Missing scope fails closed before transcription, tool planning, or audit creation.

## Replay Resistance

The Phase 8G runtime supports replay-key checks through an in-memory replay store. Durable replay protection is future work and must be added before live provider activation.

## Data Handling

Runtime audit events include metadata such as intent, confidence, tool plan, safety decision, and provider status. They do not contain raw audio, credentials, provider tokens, cookies, or authorization headers. Transcript previews are sanitized for common email, phone, and secret patterns.

## Production Gate

Production calling remains disabled. Future live voice runtime activation must pass identity, telephony, provider, consent, retention, prompt-injection, redaction, and abuse controls before any controlled production rollout.
## Phase 9 Consent, Retention, And Redaction

Phase 9 adds provider-neutral consent evaluation, retention policy resolution, transcript-preview redaction, and combined conversation safety validation. Missing required consent, raw-audio retention requests, prompt-injection attempts, and unsafe conversational conditions fail closed before tool execution. Production voice and production calling remain disabled.

## Phase 9G Safety Enforcement Review

Phase 9G fails closed for unknown consent in voice, transcription, recording, live-voice-like, and sensitive-tool contexts. Runtime validation now runs before recognition for consent-sensitive contexts and again after tool planning before any tool transition. Production voice and production calling remain disabled.
