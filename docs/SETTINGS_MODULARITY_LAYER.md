# Executive Card Modularity & Settings Layer

The Executive Card Modularity & Settings Layer is the Brand-to-Card Configuration Engine for The Executive Card. It lets each tenant configure brand identity, executive profile data, card content, QR behavior, and Polyglot Receptionist preferences without mutating UI components directly.

## System Position

Tenant / Client -> Brand Profile -> Design Tokens -> Executive Profile -> Card Content -> Receptionist Preferences -> Published Executive Card -> Interaction Events -> Dashboard Intelligence

The layer sits between the Design System Layer, Executive Identity Layer, Receptionist Agent Layer, Dashboard Layer, and Event Ledger Layer.

## Rules

- Settings do not directly mutate UI components.
- Settings generate approved tokens and immutable configuration snapshots.
- UI consumes resolved settings only.
- Receptionist workflows consume receptionist settings only.
- Dashboard reads settings history and publish events.
- Event Ledger records `settings.created`, `settings.updated`, `settings.previewed`, and `settings.published`.
- Styling must continue through `packages/tokens`, `packages/design-system`, and `packages/ui`.

## Phase 2A Scope

Phase 2A defines documentation, typed contracts, database models, and review rules. It does not build the final settings UI. The top-right settings icon placement is documented for Phase 2C.

## Settings Dashboard Target

The settings icon belongs in the top-right corner of the card UI. Clicking it opens:

```text
Settings Dashboard
├── Brand
├── Profile
├── Card Content
├── Buttons & Links
├── QR Behavior
├── Polyglot Receptionist
├── Preview
└── Publish
```

## Source Files

- `packages/types/src/branding.ts`
- `packages/types/src/card-profile.ts`
- `packages/types/src/settings.ts`
- `packages/types/src/receptionist.ts`
- `database/models/settings-model.md`
- `database/models/branding-model.md`
- `database/models/receptionist-settings-model.md`
