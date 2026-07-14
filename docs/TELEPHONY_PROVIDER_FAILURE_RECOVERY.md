# Telephony Provider Failure Recovery

## Phase 7 Scope

Phase 7G covers deterministic sandbox failures only. No external provider outage handling is active because no live provider is installed.

## Failure Categories

Sandbox failures return explicit reason codes for:

- provider mode disabled
- production mode blocked
- missing idempotency key
- duplicate idempotency key with changed payload
- invalid transfer destination
- invalid message destination or body
- unsupported conference and recording operations
- webhook signature failures
- webhook replay detection

## Recovery Behavior

Safe retries use the same idempotency key and payload. Unsafe retries with changed payloads are denied instead of creating duplicate provider actions.

## Future Live Provider Requirements

A future carrier adapter must add retry windows, provider outage classification, circuit breaking, durable idempotency storage, webhook redelivery handling, and dashboard-visible degraded-mode status.