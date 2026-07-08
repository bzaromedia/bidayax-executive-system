# Card Customization Workflow

The card customization workflow keeps each purchased Executive Card editable,
previewable, versioned, and safely publishable.

## Source Flow

Tenant / Client
-> Brand Profile
-> Design Tokens
-> Executive Profile
-> Card Content
-> Receptionist Preferences
-> Draft Settings Version
-> Preview Settings Version
-> Published Immutable Snapshot
-> Interaction Events
-> Dashboard Intelligence

## Settings Version Publish Algorithm

Purpose: prevent broken live cards.

1. User edits settings.
2. Save as draft.
3. Generate preview snapshot.
4. Validate required profile fields.
5. Validate resolved brand tokens.
6. Validate receptionist greeting and routing readiness.
7. Validate CTA and QR-facing content.
8. Publish immutable version.
9. Archive previous published version when one exists.
10. Return Event Ledger payloads for later persistence.

## Version States

- `draft`: editable, not public.
- `preview`: generated for internal review.
- `published`: immutable active version.
- `archived`: previous or retired published version.

## Snapshot Contract

A published card consumes only a resolved snapshot containing:

- Tenant brand profile
- Resolved brand tokens
- Executive card profile
- Receptionist settings
- Snapshot hash
- Generated timestamp

The UI must not read raw draft fields directly for published output.

## Event Ledger Contract

Phase 2D emits, but does not persist, these events:

- `settings.draft.created`
- `settings.preview.generated`
- `settings.publish.validation_failed`
- `settings.published`
- `settings.version.archived`

Phase 2F will connect these payloads to the Event Ledger and settings audit
trail.

## Phase 2B-2F Boundary

- Phase 2B builds the brand token resolver.
- Phase 2C builds the settings UI and top-right settings icon.
- Phase 2D builds preview/publish/versioning flow.
- Phase 2E integrates receptionist settings.
- Phase 2F emits Event Ledger and audit trail events.
