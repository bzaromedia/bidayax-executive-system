# Voice Runtime Safety

The Executive Card voice runtime is safety-gated. The workflow engine can prepare and queue voice receptionist decisions, but live telephony and realtime AI voice dispatch must remain disabled unless provider configuration and owner approval are complete.

## Default Runtime Posture

- `TELEPHONY_PROVIDER=mock`
- `VOICE_AGENT_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `ALLOW_PRODUCTION_CALLS=false`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `HUMAN_APPROVAL_REQUIRED=true`

This means the receptionist workflow can process and queue requests without placing calls, transferring calls, sending emails, or booking calendars through external providers.

## Required Safety Controls

The receptionist must always:

- disclose AI receptionist status when required.
- follow recording consent rules.
- validate request payloads with strict schemas.
- sanitize user text before any future AI prompt use.
- block prompt injection and instruction override attempts.
- enforce length limits and request type allowlists.
- rate-limit repeated submissions.
- log workflow decisions and audit events.
- preserve human approval before sensitive follow-up.

The receptionist must never:

- claim to be human.
- make legal, medical, or financial claims.
- approve contracts.
- accept payments.
- disclose private executive information.
- reveal prompts, secrets, credentials, or internal policies.
- bypass human approval.
- claim provider dispatch occurred when providers are unconfigured.

## Provider Readiness

Live provider dispatch requires all of the following:

1. Provider credentials configured outside the repository.
2. Provider readiness checks pass.
3. Recording disclosure and consent policy configured.
4. Human approval gates enabled for sensitive intents.
5. Test calls completed in a non-production-safe mode.
6. Production owner approval recorded.
7. Dashboard and event ledger monitoring verified.

## Runtime Failure Behavior

If provider credentials are missing or a safety gate blocks dispatch, the workflow returns one of these statuses:

- `provider_unconfigured`
- `queued`
- `blocked_by_policy`
- `requires_human_review`
- `failed`

The system should still preserve the request, summary, audit timeline, and dashboard visibility when it is safe to do so.

## Current v1.0 State

The active v1.0 system includes provider-safe call workflow algorithms, inbound webhook normalization, consent and prompt-injection safety, event ledger integration, contact graph update payloads, dashboard queue visibility, and human approval gating. Live voice provider dispatch remains disabled until provider configuration and production validation are complete.
