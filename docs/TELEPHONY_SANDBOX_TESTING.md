# Telephony Sandbox Testing

## Purpose

The sandbox adapter lets the project test provider-boundary behavior without installing a carrier SDK or enabling production calls.

## Required Environment

```text
TELEPHONY_PROVIDER_MODE=sandbox
TELEPHONY_SANDBOX_WEBHOOK_SECRET=<strong test-only value>
```

Do not use production credentials.

## Covered Tests

The focused telephony test suite covers:

- accepted sandbox operations
- operation idempotency
- production mode blocking
- signed webhook verification
- malformed signature rejection
- altered payload rejection
- stale and future timestamp rejection
- replay rejection
- weak secret rejection
- oversized body rejection
- unknown event rejection
- readiness reporting

## Known Limits

Replay and idempotency stores are in-memory in Phase 7G. Durable persistence is intentionally deferred until the project chooses a live provider integration path.