# Database Reconciliation

Use four sources of truth:

1. canonical migration files
2. migration ledger tables and rows if present
3. `information_schema` and `pg_catalog`
4. canonical application schema expectations

Outcome classes:

- `ALREADY_APPLIED_AND_RECORDED`
- `ALREADY_APPLIED_NOT_RECORDED`
- `PARTIALLY_APPLIED`
- `NOT_APPLIED`
- `SCHEMA_DRIFT`
- `UNSAFE_TO_REPLAY`
- `REQUIRES_MANUAL_BASELINE`
- `REQUIRES_CORRECTIVE_MIGRATION`
- `BLOCKED`

Rules:

- migrations `0001`–`0017` are immutable
- exact schema without ledger entry => baseline repair, not replay
- partial schema => corrective migration only
- drift => reviewed corrective migration only
- absent schema => controlled application only after compatibility proof
- object identity is necessary but never sufficient for equivalence
- supported schema objects must match by normalized definition, not by name alone
- schema equivalence uses deterministic normalized metadata and definition hashing
- missing canonical or live definition evidence blocks baseline repair
- unexpected scoped objects are treated as drift unless explicitly excluded by policy
- this reconciliation package remains repository-only and does not execute production changes
