# Phase 3G Persistence Review

## Verdict

Pass with documented limitations.

Phase 3G reviewed and hardened the Settings Persistence Layer introduced in commit `a1c388e`. The layer is structurally ready for pull-request review, with local unit coverage for tenant isolation, immutable published versions, append-only audit events, idempotent publish retries, archive-before-publish ordering, and transaction rollback behavior.

The PostgreSQL integration harness is present but reports `skipped` unless a disposable test database is explicitly configured. It must be run against PostgreSQL before production deployment.

## Scope Reviewed

- `database/migrations/0014_create_settings_persistence_layer.sql`
- `packages/settings/src/settings-persistence.ts`
- `packages/settings/src/settings-persistence-service.ts`
- settings persistence tests
- settings publish/versioning/audit dependencies
- settings persistence, rollback, security, concurrency, acceptance, and GitHub hygiene docs

## Defects Found

1. ID-only repository reads allowed tenant bypass if a caller knew an asset, card, or version ID.
2. `saveSettingsAuditEvent` used an upsert that could mutate existing audit evidence.
3. `saveCardSettingsVersion` used an upsert that could mutate immutable settings snapshots.
4. Publish persistence did not explicitly lock the target card row.
5. Publish persistence wrote replacement versions before archiving the old published version.
6. No idempotency record existed for duplicate publish submissions.
7. The migration documented immutability but did not enforce it at the database trigger level.
8. No PostgreSQL integration harness existed for migration 0014.

## Defects Corrected

- Repository reads for brand assets, card profiles, and settings versions are now tenant-scoped.
- Brand asset and card profile upserts now reject cross-tenant ownership reassignment.
- Settings version inserts are append-only; duplicate IDs return only matching existing immutable content.
- Published settings archival is handled by a dedicated repository method.
- Audit event inserts are append-only; duplicate deterministic event IDs return the existing event only for the same tenant/card.
- Publish persistence locks the card row with `FOR UPDATE` before write sequencing.
- Publish persistence archives the previous published version before inserting the replacement.
- Idempotency records were added for `settings.publish` retries.
- Migration 0014 now adds database triggers for published-version immutability and append-only audit events.
- A guarded PostgreSQL integration harness was added as `pnpm test:settings-persistence:postgres`.

## Migration Safety Findings

Migration 0014 is safe for an empty database and for the repository's ordered migration sequence. It uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, and `DROP TRIGGER IF EXISTS` before trigger creation.

The migration does not perform destructive operations against existing project tables. It creates Settings Layer tables, constraints, indexes, trigger functions, triggers, and comments.

## Rollback Findings

Pre-production rollback can drop the Phase 3 settings tables if no meaningful live settings data exists.

Post-production rollback is not automatically reversible. Brand profiles, card profiles, receptionist settings, settings versions, assets, idempotency records, and audit evidence must be exported or backed up before any destructive rollback. Audit and published-version evidence should be preserved where business or legal record retention requires it.

## Tenant Isolation Findings

Tenant isolation is now enforced in repository reads and update paths that previously accepted globally known IDs.

A caller cannot retrieve another tenant's asset, card profile, or settings version through the repository by knowing only the record ID. Audit and version history queries are tenant/card scoped.

## Transaction And Concurrency Findings

Publish persistence now has a transaction-compatible path through `persistSettingsPublishResultTransactionally`. It begins a transaction, locks the card row, archives the old published version, inserts the new immutable version, writes audit events, and commits. Any failure rolls back the transaction.

The partial unique index on `(card_id, tenant_id) where status = 'published'` enforces one active published version per card. The card-row lock reduces simultaneous publish races without adding distributed locking.

## Idempotency Findings

A new `settings_idempotency_keys` table stores tenant/card/operation/idempotency key records with request hashes and result references. Reusing a key with identical content returns the original result. Reusing a key with different request content is rejected.

## Audit Persistence Findings

Audit events are append-only at repository and database-trigger levels. Duplicate deterministic event IDs are safely deduplicated for the same tenant/card and rejected for cross-tenant/card conflicts.

Audit metadata is still application-provided JSON and must be sanitized before repository calls. Phase 3G did not claim legal compliance.

## PostgreSQL Integration Test Status

Command added:

```powershell
$env:NODE_ENV = "test"
$env:SETTINGS_PERSISTENCE_TEST_DATABASE_URL = "postgres://.../settings_persistence_test"
pnpm test:settings-persistence:postgres
```

The harness refuses non-test database names and skips when `NODE_ENV=test` or the disposable database URL is missing. In this environment, no disposable PostgreSQL test URL was configured, so the command was run and reported `skipped`.

## Production Configuration Notes

Production deployment requires:

- `DATABASE_URL`
- connection-pool sizing
- SSL policy appropriate to the provider
- migration execution before app startup
- database backup before migrations
- readiness checks that can detect degraded database connectivity
- telephony safety flags remaining disabled unless provider credentials and policy gates are configured

## PR Readiness

The branch is suitable for draft PR review after validation passes. Do not mark ready for merge until the PostgreSQL integration harness has run against a disposable PostgreSQL database or reviewers explicitly accept the documented limitation.
