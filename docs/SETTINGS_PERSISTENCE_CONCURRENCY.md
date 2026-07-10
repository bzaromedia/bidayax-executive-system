# Settings Persistence Concurrency

## Publish Boundary

Publishing is the highest-risk write path. Phase 3G defines the safe sequence:

1. Begin transaction.
2. Lock the tenant/card row with `FOR UPDATE`.
3. Archive the previous published version if one exists.
4. Insert the new immutable published version.
5. Persist append-only audit events.
6. Commit.

If any step fails, the transaction rolls back.

## Active Published Version

The migration enforces one active published settings version per card and tenant through:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_settings_versions_current_published
  ON card_settings_versions(card_id, tenant_id)
  WHERE status = 'published';
```

## Idempotency

`settings_idempotency_keys` prevents duplicate publish submissions from creating duplicate versions or audit events. Safe retries use the same request hash and receive the original result reference. Key reuse with different content is rejected.

## Immutable Published Versions

Published settings versions cannot be updated in place. The database trigger allows only lifecycle archival from `published` to `archived` while preserving snapshot content, snapshot hash, tenant, card, creator, timestamp, and previous-version reference.

## Audit Events

Audit events are append-only. Existing audit event rows cannot be updated. Duplicate deterministic event IDs are deduplicated only when tenant/card ownership matches.

## Race Conditions Reviewed

- simultaneous publish attempts: card row lock plus partial unique index
- duplicate publish submissions: idempotency table
- previous-version archival: archive-before-insert sequence
- audit duplication: append-only insert and deterministic IDs
- cross-tenant record access: tenant-scoped repository methods

Distributed locking was intentionally not added.
