# Settings Versioning

The Executive Card Modularity & Settings Layer uses a draft to preview to publish workflow. Phase 2F adds standardized Event Ledger-ready audit payloads to the immutable Phase 2D and Phase 2E settings pipeline.

## Version States

- `draft`: editable working settings
- `preview`: non-published settings prepared for review
- `published`: immutable settings consumed by a live card
- `archived`: previous published version replaced by a newer publish

## Immutable Snapshot

`CardSettingsSnapshot` contains the tenant brand profile, resolved brand tokens, executive card profile, receptionist settings, generated timestamp, and deterministic snapshot hash. Published rendering consumes this snapshot instead of mutable draft state.

## Compatible Event Outputs

Each settings operation preserves its existing `emittedEvents` result and adds standardized `auditEvents`.

Legacy event names remain:

- `settings.draft.created`
- `settings.preview.generated`
- `settings.publish.validation_failed`
- `settings.published`
- `settings.version.archived`
- `receptionist.settings.previewed`
- `receptionist.settings.validation_failed`
- `receptionist.settings.published`

## Audit Wiring

Draft, preview, archive, validation-failure, and successful publish paths convert their version events into the Phase 2F audit envelope. The conversion adds:

- deterministic audit event ID
- typed actor metadata
- event source
- severity
- current snapshot hash
- previous snapshot hash when applicable
- sanitized metadata

`SettingsVersionOperationResult` and `SettingsPublishResult` expose `auditEvents` alongside existing result fields.

## Publish Validation

Publish continues to block invalid profile, brand-token, CTA, and receptionist settings. Receptionist validation covers enabled state, languages, voice, mood, greeting, consent, fallback, routing, escalation, recording, and after-hours behavior.

Validation failures emit warning audit events. A failed publish does not create a published version or mutate an existing version.

## Phase Boundary

Phase 2F provides deterministic, testable, Event Ledger-ready payloads and an immutable in-memory audit trail. It does not add database persistence, migrations, provider credentials, live telephony, or production settings mutation APIs.
