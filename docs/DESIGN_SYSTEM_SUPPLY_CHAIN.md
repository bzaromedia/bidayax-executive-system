# Design System Supply Chain

## Purpose

The Design-System-to-Intelligence Supply Chain prevents BidayaX from becoming a branding-only product or a collection of inconsistent screens.

The frontend must be built from governed primitives and must connect visual decisions to business intelligence outcomes.

## Supply Chain

```text
Requirements
-> Research validation
-> Design tokens
-> Components
-> Patterns
-> Interfaces
-> Interaction events
-> Event ledger
-> Contact graph
-> Executive insights
-> Follow-up actions
```

## Why This Process Is New

Most design systems govern interface consistency. BidayaX requires the design system to also preserve intelligence continuity. A button, card, form, QR surface, dashboard panel, or receptionist workflow is not only UI. It is a controlled interaction surface that may create events, affect scoring, update the graph, and trigger follow-up.

## Single Source Of Truth

The future frontend should follow this chain:

```text
Single Source of Truth
-> Design Tokens
-> Components
-> Patterns
-> Layouts
-> Templates
-> Applications
```

## Future Folder Model

The future `packages/design-system` package should support:

```text
design-system/
+-- tokens/
+-- components/
+-- patterns/
+-- layouts/
+-- templates/
+-- branding/
+-- typography/
+-- motion/
+-- icons/
+-- storybook/
```

Phase 1 documented this model only.

Phase 2 implements the first governed foundation:

- `packages/tokens` for typed design tokens.
- `packages/ui` for foundational primitives.
- `packages/design-system` for Storybook review and governance docs.
- `packages/config` for shared Tailwind, TypeScript, and ESLint configuration.

Phase 2 does not implement application screens, business-card-specific components, dashboard-specific components, or receptionist-specific components.

## Governance Rules

No screen may introduce any of the following without approval through `packages/tokens`, `packages/design-system`, and `packages/ui`:

- New colors.
- New typography.
- New spacing.
- New radius.
- New elevation.
- New motion.
- New icons.
- New components.

## Token Scope

Future tokens should cover:

- Color roles.
- Typography roles.
- Spacing scale.
- Radius scale.
- Elevation scale.
- Motion duration and easing.
- Breakpoints.
- Focus states.
- Semantic status colors.
- Data visualization roles.

## Component Scope

Future components should be built only after tokens exist.

Candidate components:

- Button.
- Link.
- Input.
- Select.
- Checkbox.
- Toggle.
- Tabs.
- Dialog.
- Card.
- Table.
- Badge.
- Alert.
- Timeline.
- Metric.
- Priority indicator.

## Pattern Scope

Patterns should express reusable workflows:

- Executive card contact action.
- QR scan attribution.
- Lead qualification form.
- Missed-call recovery.
- Intent score explanation.
- Contact timeline.
- Follow-up queue.
- Opportunity summary.

## Interface Scope

Applications should assemble tokens, components, and patterns:

- Public card app.
- Executive dashboard.
- Receptionist console.

## Event Awareness

Every interactive pattern should eventually define:

- What event it emits.
- Which entity the event belongs to.
- Which source and campaign metadata it carries.
- Whether it can affect intent score.
- Whether it can trigger follow-up.
- Whether it requires consent or audit logging.

## Acceptance Criteria For Future UI Work

Before any production screen is accepted:

- Tokens exist for every visual decision.
- Components are reused or approved.
- Patterns are documented when repeated.
- Accessibility states are defined.
- Event emission is documented for meaningful interactions.
- The screen maps to a measurable business outcome.
- No local styling bypasses the design system without documented approval.

## Phase 1 Non-Implementation

Phase 1 creates no design tokens, components, Storybook stories, screens, CSS, or frontend code.

## Phase 2 Implementation Boundary

Phase 2 creates:

- Typed token files.
- Token-backed Tailwind configuration.
- Foundational UI primitives.
- Storybook review stories.
- Governance, accessibility, branding, motion, and validation docs.
- Root workspace configuration.

Phase 2 does not create:

- Business-card screens.
- Dashboard screens.
- Receptionist screens.
- Backend services.
- Database implementation.
- Production deployment automation.

## Phase 2 Review Scope

Review only:

- `packages/tokens`
- `packages/ui`
- `packages/design-system`
- `packages/config`
- Storybook setup
- Design governance docs
