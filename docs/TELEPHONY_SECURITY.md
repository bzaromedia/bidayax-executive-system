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
