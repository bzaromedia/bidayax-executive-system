# Settings Versioning

The Executive Card Modularity & Settings Layer uses a draft to preview to publish workflow. Phase 2E extends the Phase 2D immutable snapshot pipeline with validated Polyglot Receptionist settings.

## Version States

- `draft`: editable working settings
- `preview`: non-published settings prepared for review
- `published`: immutable settings consumed by a live card
- `archived`: previous published version replaced by a newer publish

## Immutable Snapshot

`CardSettingsSnapshot` contains the tenant brand profile, resolved brand tokens, executive card profile, receptionist settings, generated timestamp, and deterministic snapshot hash. Receptionist values are therefore versioned with the card instead of being mutable side state.

## Preview Behavior

Generating a preview:

1. preserves the complete receptionist settings object in the snapshot
2. validates the receptionist settings
3. emits `settings.preview.generated`
4. emits `receptionist.settings.previewed` with enabled, valid, and issue-count metadata

A preview can show validation issues without publishing invalid settings.

## Publish Validation

Publish blocks invalid receptionist settings, including unsupported voice or mood values, invalid language relationships, missing greetings, missing consent, invalid fallback behavior, incomplete routes, or invalid escalation contacts.

A failed receptionist publish emits:

- `settings.publish.validation_failed`
- `receptionist.settings.validation_failed`

A successful publish emits:

- `settings.published`
- `receptionist.settings.published`

Existing settings events remain unchanged:

- `settings.draft.created`
- `settings.preview.generated`
- `settings.publish.validation_failed`
- `settings.published`
- `settings.version.archived`

Events are returned as typed payloads. Phase 2E does not persist them; Event Ledger and audit persistence are Phase 2F.

## Phase Boundary

Phase 2E adds package validation, immutable preview state, publish gating, receptionist events, and a dashboard preview. It does not add migrations, provider credentials, telephony, database writes, or production publish APIs.
