# Telephony Testing

Phase 6 tests cover:

- call, callback, appointment, and voicemail state machines
- tenant-safe queue placement
- routing-policy priority and safe fallback
- provider-disabled boundary behavior
- control-plane audit and usage ledger creation
- zero-cost ledger behavior before providers exist
- PostgreSQL schema checks when a disposable database is configured

Live providers are not used in tests.

## Phase 6G Test Additions

Additional tests cover full call-state table coverage, versioned transition evidence, missing transition reasons, command disablement, missing adapters, permission denial, idempotency deduplication, stale expected versions, richer usage ledger fields, and reversal requirements.
