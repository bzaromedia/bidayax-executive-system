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
