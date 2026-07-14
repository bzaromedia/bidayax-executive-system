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
- Prompt-injection and emergency language assessment.

## Behavior

Missing or denied required consent blocks the turn. Raw audio retention blocks the turn. Prompt-injection attempts block the turn. Emergency language escalates the turn without claiming live emergency response.

## Audit Metadata

Runtime audit metadata includes consent status, safety decision, redaction status, transcript preview retention window, and sanitized transcript preview. It must not include raw audio, cookies, tokens, credentials, or authorization headers.
