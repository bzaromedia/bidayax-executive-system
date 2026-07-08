# Settings Audit Trail

Phase 2F standardizes settings and Polyglot Receptionist settings events into an immutable, Event Ledger-ready audit envelope. It does not persist events to PostgreSQL.

## Audit Event Shape

Every `SettingsAuditEvent` includes:

- `eventId`: deterministic ID derived from the normalized event payload
- `eventType`: one of the eight settings or receptionist settings event names
- `tenantId`
- `cardId`
- `actor`
- `occurredAt`
- `source`
- `snapshotHash`
- `previousSnapshotHash`
- `metadata`
- `severity`: `info`, `warning`, or `critical`

## Actor Shape

`SettingsAuditActor` includes:

- `actorId`
- `actorType`: `user | system | receptionist | admin`
- `displayName`
- optional `ipAddress`
- optional `userAgent`

When only the legacy `actorId` is available, the builder creates a deterministic user actor with the ID as its display name. Callers may provide richer actor metadata.

## Supported Events

- `settings.draft.created`
- `settings.preview.generated`
- `settings.publish.validation_failed`
- `settings.published`
- `settings.version.archived`
- `receptionist.settings.previewed`
- `receptionist.settings.validation_failed`
- `receptionist.settings.published`

Validation failures default to warning severity. Other current settings events default to info. Critical severity is available for a future policy escalation decision but is not assigned automatically in Phase 2F.

## Determinism

Audit IDs use a stable, key-sorted serialization and FNV-1a hash. Identical normalized events produce identical IDs regardless of metadata key order. The audit trail deduplicates these IDs and sorts events by timestamp and ID.

## Snapshot Lineage

- Draft events may include the previous published snapshot supplied by the caller.
- Preview events reference the draft snapshot as the previous snapshot.
- Validation failures reference the unchanged preview snapshot before and after.
- Publish events reference the previous published snapshot when one exists.
- Archive events reference the archived published snapshot.

## Metadata Safety

Audit metadata accepts primitive values only. Keys associated with authorization, cookies, credentials, passwords, secrets, sessions, or tokens are removed before output and before deterministic ID generation.

Audit metadata must contain references and decision facts, not provider credentials, raw secrets, message bodies, transcripts, or uploaded asset contents.

## Audit Trail API

`@bidayax/settings` exports:

- `createSettingsAuditEvent`
- `createSettingsAuditEventFromVersionEvent`
- `createSettingsAuditEvents`
- `createSettingsAuditTrail`
- `appendSettingsAuditEvents`
- `findSettingsAuditEventsByType`

The trail is immutable, card- and tenant-scoped, chronologically ordered, deduplicated, and exposes the latest non-null snapshot hash.

## Persistence Boundary

Phase 2F returns audit payloads from draft, preview, archive, validation-failure, and publish operations. No database migration, API write, event queue, or provider integration is added. Durable append-only Event Ledger persistence remains a later authenticated backend concern.
