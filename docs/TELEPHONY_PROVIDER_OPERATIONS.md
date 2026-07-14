# Telephony Provider Operations

## Phase 7 Operations

The sandbox adapter implements provider-shaped operations for:

- inbound answer
- outbound dial
- transfer
- hangup
- message

Every operation remains test-only and returns deterministic provider references. No carrier API is called.

## Idempotency

Sandbox operations require stable idempotency keys derived from the call session. A duplicate operation with the same payload returns the original result. A duplicate idempotency key with different payload content is denied.

## Production Controls

Sandbox operations are accepted only when execution mode is `sandbox`. Disabled, mock, or production execution modes do not place calls. Production mode is explicitly blocked in Phase 7.

## Operational Readiness

Readiness checks expose provider mode, sandbox signature policy, production-mode blocking, and production-environment sandbox blocking without revealing secrets.