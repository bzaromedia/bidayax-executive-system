# Settings UI

Phase 2C adds the first Settings UI surface for the Executive Card Modularity &
Settings Layer. It is intentionally preview-first and does not persist settings,
create migrations, or alter receptionist runtime behavior.

## Card Entry Point

The Executive Card UI now includes a settings icon in the top-right corner of the
card surface. The control:

- uses the existing card token system for color, spacing, focus, radius, shadow,
  and motion;
- respects mobile safe-area spacing;
- opens the dashboard settings route in a separate tab;
- links to `/settings/card-customization?card={slug}` on the dashboard host;
- does not expose database writes or publish actions.

## Settings Dashboard Sections

The settings dashboard shell includes these Phase 2C sections:

1. Brand
2. Profile
3. Card Content
4. Buttons & Links
5. QR Behavior
6. Polyglot Receptionist
7. Preview
8. Publish

The dashboard consumes existing typed configuration generated from the production
executive profiles and reuses the existing settings panels where possible.

## Preview State

Phase 2C uses local typed temporary preview state derived from the current
production profile settings. This state is clearly scoped to preview behavior and
is not persisted.

Preview state includes:

- `CustomerCardSettings`
- derived `TenantBrandProfile`
- `ResolvedBrandTokens` from `packages/tokens`
- enabled action count for publish-readiness display

## Brand Token Consumption

The dashboard calls `resolveBrandTokens` from `@bidayax/tokens` to show the
resolved token snapshot, resolver version, WCAG contrast results, warnings, and
snapshot hash. Raw tenant colors do not flow directly into application styling.

## Publish Boundary

The Publish section is a gate, not a live publisher. It shows readiness checks and
marks immutable publish/version behavior as the Phase 2D boundary.

Phase 2C does not add:

- database persistence;
- migrations;
- live publish actions;
- receptionist runtime changes;
- new dependencies;
- raw app-level styling outside token classes and CSS variables.

## Design Governance

All card styles use existing CSS variables from `@bidayax/tokens`. Dashboard
layout uses existing `@bidayax/ui` primitives and token-backed utility classes.
