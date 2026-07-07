# Card Customization Workflow

The card customization workflow keeps each purchased Executive Card editable, previewable, versioned, and safely publishable.

## Settings Version Publish Algorithm

Purpose: prevent broken live cards.

1. User edits settings.
2. Save as draft.
3. Validate required fields.
4. Validate brand tokens.
5. Validate image assets.
6. Validate receptionist greeting and routing rules.
7. Generate preview snapshot.
8. Run acceptance checks.
9. Publish immutable version.
10. Archive previous version.
11. Emit `settings.published` event to Event Ledger.

## Version States

- `draft`: editable, not public.
- `preview`: validated enough for internal preview.
- `published`: immutable active version.
- `archived`: previous or retired version.

## Snapshot Contract

A published card consumes only a resolved snapshot containing:

- Tenant brand profile
- Resolved brand tokens
- Executive card profile
- Receptionist settings

The UI must not read raw draft fields directly.

## Phase 2B-2F Boundary

- Phase 2B builds the brand token resolver.
- Phase 2C builds the settings UI and top-right settings icon.
- Phase 2D builds preview/publish/versioning flow.
- Phase 2E integrates receptionist settings.
- Phase 2F emits Event Ledger and audit trail events.
