# Conversational Safety Validation

## Purpose

The conversation safety validator produces one provider-neutral decision before runtime tool execution:

- `allow`
- `escalate`
- `block`

## Inputs

- Transcript.
- Runtime mode.
- Consent context.
- Consent policy.
- Retention policy.
- Redaction policy.
- Consent-sensitive requested capabilities.
- Prompt-injection and emergency language assessment.

## Phase 9G Behavior

Safety validation runs before recognition for voice, transcription, recording, and live-voice-like contexts so unknown consent cannot permit transcript capture. It runs again after tool planning so sensitive tool paths cannot execute without consent evidence.

Missing or denied required consent blocks the turn. Raw audio retention blocks the turn. Prompt-injection attempts block the turn. Emergency language escalates the turn without claiming live emergency response, professional advice, or dispatch.

## Audit Metadata

Runtime audit metadata includes consent status, safety decision, redaction status, transcript preview retention window, and sanitized transcript preview. It must not include raw audio, cookies, tokens, credentials, authorization headers, or raw transcript text.
