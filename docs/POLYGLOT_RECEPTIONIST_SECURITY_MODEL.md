# Polyglot Receptionist Security Model

The Polyglot Receptionist workflow is designed to accept public card requests without exposing secrets, provider controls, or unsupported automation.

## Human Abuse Controls

- Zod validation on all public receptionist endpoints.
- Consent is required before a request can proceed.
- Strict request type allowlist.
- Message and identity field length limits.
- Email and phone format checks.
- In-memory rate-limit policy for repeated request bursts.
- Safe error responses.

## Prompt Attack Controls

The prompt injection guard blocks instruction override attempts, system prompt extraction requests, secret extraction attempts, unsafe script links, policy bypass language, and jailbreak patterns.

Raw user input must not be passed into future AI prompts without sanitization. The workflow stores sanitized message content in routing and notification payloads.

## Provider Safety

Provider dispatch depends on explicit environment configuration and safety flags. If credentials or flags are absent, requests remain queued internally with dashboard-visible provider_unconfigured status.

## Audit Events

Every accepted workflow run creates an audit sequence for request receipt, consent validation, language classification, routing, event-ledger preparation, provider dispatch state, dashboard visibility, and final audit completion.

## Crypto Boundary

The cryptographic layer is not implemented in this phase. It should be added only after this workflow passes production validation.
