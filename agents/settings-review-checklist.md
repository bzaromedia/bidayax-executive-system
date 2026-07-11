# Settings Review Checklist

Use this checklist before accepting Phase 2A changes for The Executive Card
Modularity & Settings Layer.

## Scope

- [ ] All active files are inside `D:\bidayax-executive-system`.
- [ ] No duplicate project roots, stores, packages, scripts, or generated files
      outside the source-of-truth root were used.
- [ ] The phase remains documentation and type foundation only.
- [ ] No marketing site work was introduced.
- [ ] No provider credentials, secrets, or production `.env` files were added.

## Architecture

- [ ] Settings sit between the design system, executive identity,
      receptionist, dashboard, and Event Ledger layers.
- [ ] Settings generate approved snapshots instead of directly mutating UI.
- [ ] Card UI consumes resolved settings only.
- [ ] Receptionist workflows consume receptionist settings only.
- [ ] Dashboard and Event Ledger hooks are documented.

## Types

- [ ] `TenantBrandProfile` includes all required tenant branding fields.
- [ ] `ExecutiveCardProfile` includes all card identity, contact, CTA, social,
      QR, draft, published, and status fields.
- [ ] `ReceptionistSettings` includes language, voice, mood, greeting, routing,
      appointment, escalation, consent, and recording policy fields.
- [ ] `CardSettingsVersion` includes snapshot, actor, timestamp, and version
      status fields.

## Database Models

- [ ] `tenants` is documented.
- [ ] `tenant_brand_profiles` is documented.
- [ ] `executive_card_profiles` is documented.
- [ ] `receptionist_settings` is documented.
- [ ] `card_settings_versions` is documented.
- [ ] `brand_assets` is documented.
- [ ] `settings_audit_events` is documented.
- [ ] Relationships, indexes, constraints, and versioning rules are included.

## Design Governance

- [ ] The settings icon is documented as top-right on the card UI.
- [ ] Settings Dashboard sections are documented:
      Brand, Profile, Card Content, Buttons & Links, QR Behavior,
      Polyglot Receptionist, Preview, Publish.
- [ ] No raw styling bypasses tokens, `packages/design-system`, or `packages/ui`.
- [ ] The Brand Token Resolution Algorithm preserves The Executive Card luxury
      design language.

## Publish Safety

- [ ] Settings Version Publish Algorithm blocks incomplete profile data.
- [ ] Brand-token validation and fallback behavior are documented.
- [ ] Asset validation is documented.
- [ ] Receptionist greeting and routing validation are documented.
- [ ] Immutable published version behavior is documented.
- [ ] `settings.published` Event Ledger hook is documented.

## Git Hygiene

- [ ] Work is on `feature/settings-modularity-layer`.
- [ ] Commit message is `feat(settings): add executive card modularity foundation`.
- [ ] The branch is not pushed unless explicitly approved.
- [ ] No pull request is opened unless explicitly approved.
