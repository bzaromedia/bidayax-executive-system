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

## Phase 4 Acceptance Criteria

Phase 4 passes when:

1. `interaction_events` table migration exists.
2. Shared event types exist.
3. `POST /api/events` exists.
4. Events are validated.
5. Events are stored in PostgreSQL when `DATABASE_URL` is configured.
6. Card route load emits `card_view`.
7. QR-marked card route load emits `qr_scan`.
8. vCard download emits `vcard_download`.
9. Call click emits `call_click`.
10. Email click emits `email_click`.
11. Website click emits `website_click`.
12. Anonymous visitor tracking works without login.
13. Anonymous session tracking works without login.
14. Event logging failure does not break the card.
15. No raw IP addresses are stored.
16. No dashboard was built.
17. No CRM was built.
18. No receptionist was built.
19. No intent scoring was built.
20. Documentation explains the ledger clearly.

## Phase 4 Non-Goals

Phase 4 must not include:

- Analytics dashboard.
- Charts.
- Receptionist agent.
- CRM functionality.
- Contact records.
- Lead records.
- Intent scoring.
- Contact graph updates.
- Email automation.
- Call automation.
- Scheduling system.
- Admin portal.
- Login or authentication.
- Payment system.
- Recursive improvement implementation.

## Phase 5 Acceptance Criteria

Phase 5 passes when:

1. `apps/dashboard` exists.
2. Dashboard reads from `interaction_events`.
3. Metric cards show real counts.
4. Executive breakdown works.
5. Event-type breakdown works.
6. Recent interaction feed works.
7. Conversion summaries work.
8. Empty state works when no data exists or the database is unavailable.
9. No fake data is shown.
10. No raw IP is exposed.
11. No receptionist functionality exists.
12. No CRM functionality exists.
13. No lead scoring exists.
14. No intent scoring exists.
15. No scheduling exists.
16. UI uses approved design-system tokens and primitives.
17. `apps/dashboard/README.md` explains how to run and verify Phase 5.

## Phase 5 Non-Goals

Phase 5 must not include:

- Receptionist agent.
- CRM functionality.
- Contact records.
- Lead records.
- Lead scoring.
- Intent scoring.
- Call automation.
- Email automation.
- Scheduling system.
- User accounts.
- Complex admin permissions.
- Full business intelligence platform.
- Recursive improvement implementation.

## Phase 6 Acceptance Criteria

Phase 6 passes when:

1. `intent_scores` table migration exists.
2. Intent types exist.
3. Reason codes exist.
4. Tier definitions exist.
5. Pure scoring function exists.
6. Unit tests exist.
7. Score recalculation pathway exists.
8. Dashboard shows top intent signals.
9. Dashboard shows tier breakdown.
10. Dashboard shows reason codes.
11. No CRM was built.
12. No receptionist was built.
13. No contact enrichment was built.
14. No machine learning was added.
15. No raw IPs are stored or used.
16. Documentation explains the scoring engine clearly.
17. README explains how to run and verify Phase 6.

## Phase 6 Non-Goals

Phase 6 must not include:

- Receptionist agent.
- CRM functionality.
- Scheduling.
- Email automation.
- Call automation.
- Contact enrichment.
- User accounts.
- Complex ML model.
- Autonomous AI decision-making.
- Recursive improvement implementation.

## Phase 7 Acceptance Criteria

Phase 7 passes when:

1. `contact_graph_nodes` table exists.
2. `contact_graph_edges` table exists.
3. `contact_graph_snapshots` table exists.
4. Graph node types exist.
5. Graph edge types exist.
6. Deterministic graph builder exists.
7. Stable keys are used.
8. Duplicate graph entries are prevented.
9. Graph snapshots are created.
10. Dashboard shows graph summaries.
11. Dashboard shows engagement paths.
12. Anonymous visitors remain anonymous.
13. No CRM was built.
14. No receptionist was built.
15. No external enrichment was added.
16. No identity guessing was added.
17. Tests exist.
18. Documentation explains the graph system clearly.
19. README explains how to run and verify Phase 7.

## Phase 7 Non-Goals

Phase 7 must not include:

- Full CRM.
- Contact enrichment.
- Identity guessing.
- Email automation.
- Call automation.
- Receptionist agent.
- Scheduling workflows.
- Lead pipeline.
- Sales pipeline.
- External data broker integrations.
- AI identity resolution.
- Recursive improvement implementation.

## Phase 8 Acceptance Criteria

Phase 8 passes when:

1. All work is inside `D:\bidayax-executive-system`.
2. `receptionist_interactions` table migration exists.
3. `receptionist_tasks` table migration exists.
4. `receptionist_conversation_turns` table migration exists.
5. `receptionist_workflow_events` table migration exists.
6. Receptionist shared types exist.
7. Deterministic intent categories exist.
8. Language profile model exists.
9. Escalation rules exist.
10. Task generation rules exist.
11. Simulation workflow exists.
12. Unit tests exist.
13. Dashboard shows receptionist foundation data.
14. Dashboard clearly avoids fake production claims.
15. No live calls are made.
16. No real emails are sent.
17. No real calendar events are booked.
18. No external API integration is added.
19. Documentation explains the receptionist foundation clearly.
20. README explains how to run and verify Phase 8.

## Phase 8 Non-Goals

Phase 8 must not include:

- Live phone calling.
- Twilio integration.
- OpenAI Realtime integration.
- Real outbound calls.
- Real email sending.
- Real calendar booking.
- Full CRM.
- Payment systems.
- Autonomous receptionist deployment.
- Production phone number routing.
- External workflow engines.
