# Telephony Security

Security principles:

- Production calling is disabled by default.
- No provider credentials are stored or required in Phase 6.
- Tenant/card ownership is enforced at the database boundary.
- Routing, queueing, usage, and audit operations are tenant-scoped.
- Usage ledger and audit event tables are append-only.
- Future provider webhooks must be verified before they can affect domain records.
- Emergency, recording, transcription, and consent policies remain modeled but inactive.

Future provider work must preserve Phase 5 identity and authorization. UI visibility is not authorization.

## Phase 6G Command Gates

Telephony commands are denied when telephony is disabled, when the required permission is absent, when a provider adapter is required but unavailable, when production calling is enabled inside Phase 6, when the idempotency key is duplicated, or when the expected version is stale.

Emergency-language and prohibited-use signals are modeled only for safe termination, blocking, or human escalation. The system does not diagnose emergencies or dispatch emergency services.
