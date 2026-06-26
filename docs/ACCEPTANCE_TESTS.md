# Acceptance Tests

## Purpose

This document defines acceptance checks for Phase 1 and the template for future phase gates.

Phase 1 acceptance tests are documentation and structure checks only.

## Phase 1 Acceptance Criteria

Phase 1 passes when:

1. The required folder structure exists.
2. All required docs exist.
3. `agents/AGENTS.md` exists.
4. The project thesis is clear.
5. The engineering methodology is explicit.
6. The design-system supply chain is documented.
7. The Identity-to-Intelligence Architecture is documented.
8. The Executive Intent Scoring Algorithm is documented.
9. The Executive Contact Graph is documented.
10. Research validation answers whether adjacent systems already exist.
11. Research validation explains why similar approaches are insufficient.
12. Research validation explains why BidayaX can succeed.
13. Research validation defines measurable advantages.
14. No production UI code exists.
15. No backend implementation exists.
16. No database migration exists.
17. No receptionist implementation exists.

## Required Documents

- `README.md`
- `docs/SYSTEM_THESIS.md`
- `docs/RESEARCH_VALIDATION.md`
- `docs/ENGINEERING_METHODOLOGY.md`
- `docs/ARCHITECTURE.md`
- `docs/ALGORITHMS.md`
- `docs/DATA_STRUCTURES.md`
- `docs/DESIGN_SYSTEM_SUPPLY_CHAIN.md`
- `docs/EVENT_LEDGER.md`
- `docs/RECEPTIONIST_OS.md`
- `docs/DATABASE_MODEL.md`
- `docs/SECURITY_MODEL.md`
- `docs/DEPLOYMENT_MODEL.md`
- `docs/ACCEPTANCE_TESTS.md`
- `agents/AGENTS.md`
- `agents/codex-rules.md`
- `agents/review-checklist.md`

## Phase 1 Pass Questions

The docs must clearly answer:

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

## Phase 1 Answer Index

- Why does it work? See `docs/SYSTEM_THESIS.md`.
- How does it work? See `docs/SYSTEM_THESIS.md` and `docs/ARCHITECTURE.md`.
- What algorithm is new? See `docs/ALGORITHMS.md`.
- What architecture is new? See `docs/ARCHITECTURE.md`.
- What data structure is new? See `docs/DATA_STRUCTURES.md`.
- What process is new? See `docs/DESIGN_SYSTEM_SUPPLY_CHAIN.md`.
- Has this been done before? See `docs/RESEARCH_VALIDATION.md`.
- Why did similar systems fail? See `docs/RESEARCH_VALIDATION.md`.
- Why can this version succeed? See `docs/RESEARCH_VALIDATION.md`.
- What measurable advantage exists? See `docs/RESEARCH_VALIDATION.md` and `docs/SYSTEM_THESIS.md`.

## Future Phase Acceptance Template

Every future phase should define:

- Phase goal.
- Explicit non-goals.
- Source-of-truth docs to read first.
- Files or packages allowed to change.
- Architecture decisions locked or changed.
- Tests required.
- Observability required.
- Security review required.
- Demonstrable milestone.
- Business metric affected.

## Phase 1 Non-Code Check

The following should remain absent in Phase 1:

- `package.json`
- app source files.
- React components.
- CSS files.
- API handlers.
- service runtime files.
- database migration files.
- Dockerfiles.
- Caddy config.
- receptionist prompts or runtime logic.

Documentation and structure markers are allowed.

## Phase 2 Acceptance Criteria

Phase 2 passes when:

1. pnpm workspace exists.
2. TurboRepo config exists.
3. `packages/tokens` exists.
4. `packages/ui` exists.
5. `packages/design-system` exists.
6. `packages/config` exists.
7. Typed token files exist.
8. Foundational UI primitives exist.
9. Storybook structure exists.
10. Governance docs exist.
11. No application screens exist.
12. No final business card exists.
13. No dashboard UI exists.
14. No receptionist UI exists.
15. No backend implementation exists.
16. No database implementation exists.
17. Styling routes through tokens.
18. README explains how to run, test, and review the design system.

## Phase 2 Review Scope

Review only:

- `packages/tokens`
- `packages/ui`
- `packages/design-system`
- `packages/config`
- Storybook setup.
- Design governance docs.

## Phase 3 Acceptance Criteria

Phase 3 passes when:

1. `apps/card` exists.
2. `/card/ad-garner` exists.
3. `/card/naimah-barnes` exists.
4. `/card/sean-hall` exists.
5. Each route renders the correct executive card.
6. Each route displays a QR code.
7. Each route supports vCard download.
8. Call, email, and website actions exist.
9. Design uses approved tokens.
10. Components use approved UI primitives.
11. No dashboard exists.
12. No receptionist UI exists.
13. No backend API exists.
14. No database logic exists.
15. Motion is restrained and premium.
16. Layout is responsive.
17. Accessibility requirements are met.
18. `apps/card/README.md` explains how to run and test Phase 3.

## Phase 3 Non-Goals

Phase 3 must not include:

- Dashboard analytics.
- Backend APIs.
- Database tables.
- Receptionist agent.
- Call automation.
- Email automation.
- Scheduling system.
- CRM system.
- Recursive improvement engine implementation.
- Admin portal.
- Login or authentication.
- Payment system.
- Extra apps.
