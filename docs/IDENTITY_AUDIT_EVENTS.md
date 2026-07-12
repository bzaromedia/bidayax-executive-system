# Identity Audit Events

Identity audit events are sanitized security records written through `@bidayax/identity`.

## Event Types

- `identity.login.started`
- `identity.login.succeeded`
- `identity.login.failed`
- `identity.logout`
- `identity.session.created`
- `identity.session.refreshed`
- `identity.session.revoked`
- `identity.membership.denied`
- `identity.card_access.denied`
- `identity.provider_webhook.received`
- `identity.provider_webhook.rejected`
- `identity.account.disabled`

## Shape

Each event includes event ID, event type, provider, timestamp, result, reason code, user ID when known, tenant ID when known, session ID when applicable, and sanitized metadata.

## Redaction Rules

Audit metadata must never include raw credentials, tokens, cookies, authorization headers, provider secrets, full webhook payloads, raw provider access tokens, PKCE verifiers, or application session tokens.

## Persistence

`identity_audit_events` is append-only. Updates and deletes are blocked by database trigger.
