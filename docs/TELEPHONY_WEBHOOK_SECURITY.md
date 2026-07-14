# Telephony Webhook Security

## Current Phase

Phase 7G implements webhook security for the internal sandbox adapter only. It does not implement or claim live carrier webhook verification.

## Sandbox Webhook Contract

Required headers:

```text
content-type: application/json
x-bidayax-sandbox-event-id: <stable provider event id>
x-bidayax-sandbox-timestamp: <ISO timestamp>
x-bidayax-sandbox-signature: v1;alg=hmac-sha256;sig=<64 hex chars>
```

Canonical signed payload:

```text
v1.<timestamp>.<eventId>.<rawBody>
```

## Rejection Conditions

Sandbox webhooks are rejected when:

- sandbox mode is disabled
- the sandbox secret is missing or weak
- the body is oversized
- content type is not JSON
- event ID is missing
- timestamp is missing, stale, or too far in the future
- signature format is malformed
- signature digest does not match
- replay store already contains the event ID

## Audit Normalization

Accepted sandbox events are normalized into `TelephonyAuditEvent` records with sanitized metadata. Raw request bodies, signatures, secrets, and headers are not persisted in audit metadata.

## Replay Limitation

Phase 7G provides an in-memory replay store for deterministic tests. Durable replay protection must be added before any live provider webhook is accepted.