# Codex Operating Rules

## Required Reading Before Code

Before writing implementation code, Codex must read the relevant source-of-truth documents:

1. `README.md`
2. `docs/SYSTEM_THESIS.md`
3. `docs/ENGINEERING_METHODOLOGY.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DESIGN_SYSTEM_SUPPLY_CHAIN.md`
6. `docs/ALGORITHMS.md` when scoring behavior is involved.
7. `docs/DATA_STRUCTURES.md` when contact, graph, or relationship behavior is involved.
8. `docs/EVENT_LEDGER.md` when interaction capture or processing is involved.
9. `docs/SECURITY_MODEL.md` when personal data, automation, authentication, or access is involved.
10. `docs/ACCEPTANCE_TESTS.md` for the active phase gate.

## Core Rules

1. Always read docs before writing code.
2. Never skip the source-of-truth documents.
3. Never create screens before tokens.
4. Never create components before tokens.
5. Never introduce styling outside the design system.
6. Never add dependencies without justification.
7. Never add abstractions without at least two real use cases.
8. Never optimize before correctness.
9. Every phase must include acceptance criteria.
10. Every feature must be observable.
11. Every implementation must be testable.
12. Every change must preserve the project thesis.
13. Prefer simple vertical slices.
14. Avoid speculative architecture.
15. Document every architectural decision.

## Phase 1 Boundary

Phase 1 is documentation and structure only.

Codex must not create:

- UI screens.
- Frontend components.
- Backend services.
- Database migrations.
- Receptionist logic.
- Production application code.
- Deployment implementation.

## Phase 2 Boundary

Phase 2 is the Design System Supply Chain Foundation.

Codex may create:

- pnpm workspace configuration.
- TurboRepo configuration.
- typed design tokens.
- foundational UI primitives.
- Storybook review structure.
- design governance documentation.

Codex must not create:

- application screens.
- final business card UI.
- dashboard UI.
- receptionist UI.
- backend services.
- database implementation.
- production deployment automation.

## Phase 3 Boundary

Phase 3 is the Executive Digital Business Card Vertical Slice.

Codex may create:

- `apps/card`.
- three executive card routes.
- static executive data.
- QR code display.
- vCard export.
- call, email, and website actions.
- restrained GSAP motion.
- card-specific composition under `apps/card/src/components`.

Codex must not create:

- dashboard analytics.
- backend APIs.
- database tables or migrations.
- receptionist agent logic.
- call, email, or scheduling automation.
- CRM workflows.
- recursive improvement engine implementation.
- admin portal.
- login or authentication.
- payment system.
- extra apps.

## Phase 4 Boundary

Phase 4 is the QR Interaction Event Ledger.

Codex may create:

- shared event type definitions.
- anonymous visitor and session tracking.
- a single `POST /api/events` route handler.
- event validation.
- basic user-agent normalization.
- IP hashing.
- the `interaction_events` PostgreSQL migration.
- interaction event model documentation.
- card action event emission.

Codex must not create:

- dashboard analytics.
- charts.
- CRM functionality.
- contact records.
- lead records.
- receptionist agent logic.
- call, email, or scheduling automation.
- intent scoring.
- contact graph updates.
- admin portal.
- login or authentication.
- payment system.
- recursive improvement engine implementation.
- speculative microservices.

## Phase 5 Boundary

Phase 5 is the Executive Interaction Dashboard.

Codex may create:

- `apps/dashboard`.
- server-side PostgreSQL reads from `interaction_events`.
- metric cards for real event counts.
- executive activity breakdown.
- event-type activity breakdown.
- recent anonymous interaction feed.
- simple conversion summaries.
- empty and unavailable states.
- dashboard documentation.

Codex must not create:

- receptionist agent logic.
- CRM functionality.
- contact records.
- lead records.
- lead scoring.
- intent scoring.
- contact graph updates.
- call, email, or scheduling automation.
- user accounts.
- complex admin permissions.
- payment system.
- recursive improvement engine implementation.
- full business intelligence platform.

## Design Governance

No screen may introduce new visual decisions without approval through:

- `packages/tokens`
- `packages/design-system`
- `packages/ui`

This applies to colors, typography, spacing, radius, elevation, motion, icons, components, and layout primitives.

## Architecture Governance

Every major decision must answer:

- Why does it work?
- How does it work?
- What algorithm is new?
- What architecture is new?
- What data structure is new?
- What process is new?
- Has this been done before?
- Why did similar systems fail?
- Why can this version succeed?
- What measurable advantage exists?

## Implementation Discipline

When implementation begins in a later phase:

- Start with the smallest complete vertical slice.
- Use direct domain models before abstractions.
- Add dependencies only when the benefit is concrete.
- Keep business rules explainable.
- Add tests proportionate to risk.
- Add observability for important workflows.
- Update documentation when behavior or architecture changes.

## Review Gate

Before Codex completes a task, it must check:

- Did the work stay inside the requested phase?
- Did it preserve the identity-to-intelligence thesis?
- Did it avoid speculative architecture?
- Did it avoid unapproved design-system changes?
- Did it include tests or explain why tests are not applicable?
- Did it update source-of-truth docs when needed?
