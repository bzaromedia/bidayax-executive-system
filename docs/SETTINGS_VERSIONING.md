# Settings Versioning

Phase 2D adds the Preview / Publish / Versioning Flow for the Executive Card
Modularity & Settings Layer.

This phase is package-level and side-effect free. It does not create production
database migrations, dashboard write APIs, or runtime persistence. It produces
immutable version objects and documented Event Ledger payloads for later
persistence layers to consume.

## Version States

- `draft`: editable working settings created from customer edits.
- `preview`: validated enough for an internal preview surface.
- `published`: immutable settings version consumed by a live card.
- `archived`: previous published version retired when a replacement publishes.

## Immutable Snapshot

A `CardSettingsSnapshot` contains:

- tenant brand profile
- resolved brand token snapshot
- executive card profile
- receptionist settings
- generated timestamp
- deterministic settings snapshot hash

Published card rendering must consume the snapshot, not raw draft fields.

## Publish Result

`publishSettingsVersion` returns:

- `publishedVersionId`
- `archivedVersionId` when an existing published version is replaced
- `snapshotHash`
- `emittedEvents[]`
- `warnings[]`
- validation details
- updated in-memory version list

## Event Ledger Payloads

Phase 2D emits structured payloads for these event names:

- `settings.draft.created`
- `settings.preview.generated`
- `settings.publish.validation_failed`
- `settings.published`
- `settings.version.archived`

The events are returned to callers. They are not persisted by this phase.

## Validation Before Publish

Publish validation checks:

- source version is draft or preview
- executive name, title, company, email, phone, and website are present
- resolved brand token snapshot exists
- resolved brand tokens meet WCAG AA contrast
- version hash matches immutable snapshot hash
- receptionist consent disclosure is present
- custom receptionist greeting is not empty when custom mode is selected
- visible primary CTA has label and destination

Safe brand fallback usage is reported as a warning, not a blocker.

## Phase Boundary

Phase 2D does not add:

- database persistence
- dashboard mutation APIs
- receptionist runtime behavior
- production publish buttons wired to storage
- migrations

Those belong to Phase 2E and Phase 2F.
