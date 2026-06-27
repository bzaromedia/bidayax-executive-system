# BidayaX Executive System

BidayaX Executive System is an Executive Identity Intelligence System. Its purpose is to turn every external business interaction into structured executive intelligence.

This repository has completed Phase 1: Foundation, Research, and Architecture Lock-In; Phase 2: Design System Supply Chain Foundation; Phase 3: Executive Digital Business Card Vertical Slice; Phase 4: QR Interaction Event Ledger; Phase 5: Executive Interaction Dashboard; Phase 6: Executive Intent Scoring Engine; Phase 7: Executive Contact Graph; Phase 8: Polyglot Receptionist OS Foundation; and Phase 9: Live Voice + Telephony Integration Preparation.

Phase 3 creates the first visible product surface: a static, luxury executive digital business card app. It intentionally does not include dashboard analytics, receptionist UI, backend services, database migrations, receptionist logic, CRM workflows, authentication, or production deployment automation.

Phase 4 creates the first measurement layer behind the card: a privacy-respecting event ingestion API, anonymous browser session tracking, and the `interaction_events` PostgreSQL ledger table.

Phase 5 creates the first internal intelligence surface: a truthful dashboard that reads from `interaction_events` and summarizes card views, action clicks, executive activity, recent interactions, and simple conversion ratios.

Phase 6 creates the first decision-intelligence layer: a deterministic, explainable scoring engine that ranks anonymous interaction groups by business intent.

Phase 7 creates the relationship-intelligence layer: a deterministic, privacy-respecting contact graph that connects anonymous visitors, sessions, executive cards, interaction events, and intent scores without identifying people or building CRM functionality.

Phase 8 creates the receptionist foundation: simulated receptionist interactions, deterministic intent classification, language profiles, task generation, escalation recommendations, and dashboard visibility without live calls, emails, calendars, or external workflow integrations.

Phase 9 creates the telephony preparation layer: provider abstraction, mock provider behavior, inbound webhook scaffolding, outbound request safety gates, call lifecycle tracking, voice session metadata, and dashboard readiness visibility without real call execution.

## System Definition

The system connects:

```text
Executive identity
-> Digital business card
-> QR interactions
-> Phone calls
-> Emails
-> Scheduling
-> Receptionist automation
-> Contact intelligence
-> Executive dashboard
-> Follow-up automation
```

It is not merely a digital card, AI receptionist, CRM, contact page, or dashboard. The value is the integrated operating model that links identity, interaction capture, event logging, intent scoring, contact graph intelligence, receptionist workflow, dashboards, and follow-up automation.

## Phase 1 Source Of Truth

Read these documents before starting any implementation phase:

- [docs/SYSTEM_THESIS.md](docs/SYSTEM_THESIS.md)
- [docs/RESEARCH_VALIDATION.md](docs/RESEARCH_VALIDATION.md)
- [docs/ENGINEERING_METHODOLOGY.md](docs/ENGINEERING_METHODOLOGY.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ALGORITHMS.md](docs/ALGORITHMS.md)
- [docs/DATA_STRUCTURES.md](docs/DATA_STRUCTURES.md)
- [docs/DESIGN_SYSTEM_SUPPLY_CHAIN.md](docs/DESIGN_SYSTEM_SUPPLY_CHAIN.md)
- [docs/EVENT_LEDGER.md](docs/EVENT_LEDGER.md)
- [docs/RECEPTIONIST_OS.md](docs/RECEPTIONIST_OS.md)
- [docs/DATABASE_MODEL.md](docs/DATABASE_MODEL.md)
- [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md)
- [docs/DEPLOYMENT_MODEL.md](docs/DEPLOYMENT_MODEL.md)
- [docs/ACCEPTANCE_TESTS.md](docs/ACCEPTANCE_TESTS.md)
- [docs/EXECUTIVE_CONTACT_GRAPH.md](docs/EXECUTIVE_CONTACT_GRAPH.md)
- [docs/POLYGLOT_RECEPTIONIST_OS.md](docs/POLYGLOT_RECEPTIONIST_OS.md)
- [docs/LIVE_VOICE_TELEPHONY_INTEGRATION_PREPARATION.md](docs/LIVE_VOICE_TELEPHONY_INTEGRATION_PREPARATION.md)
- [docs/TELEPHONY_SAFETY_MODEL.md](docs/TELEPHONY_SAFETY_MODEL.md)
- [agents/AGENTS.md](agents/AGENTS.md)

## Phase 2 Design System Foundation

Phase 2 implements the supply chain:

```text
Source of Truth
-> Design Tokens
-> Primitive Components
-> Composite Components
-> Patterns
-> Layouts
-> Templates
-> Applications
```

Only the first reusable foundation layers are implemented:

- `packages/tokens`: typed color, typography, spacing, radius, elevation, motion, z-index, breakpoint, and CSS variable tokens.
- `packages/ui`: foundational React primitives only.
- `packages/design-system`: Storybook review surface and governance documentation.
- `packages/config`: shared Tailwind, TypeScript, and ESLint configuration.
- `packages/types`: shared type package foundation.

Phase 2 primitives:

- Button
- Card
- Badge
- Input
- Label
- Separator
- Avatar
- IconButton
- Surface
- Container
- Stack
- Grid
- Section
- VisuallyHidden

## Running The Design System

Install dependencies:

```bash
pnpm install
```

Run Storybook:

```bash
pnpm storybook
```

Run validation:

```bash
pnpm typecheck
pnpm lint
pnpm build:storybook
```

Storybook is the visual review layer before application screens are created.

## Phase 3 Card App

The first working product surface lives in `apps/card`.

Routes:

- `/card/ad-garner`
- `/card/naimah-barnes`
- `/card/sean-hall`

Run the app:

```bash
pnpm --filter @bidayax/card dev
```

Validate the app:

```bash
pnpm --filter @bidayax/card typecheck
pnpm --filter @bidayax/card lint
pnpm --filter @bidayax/card build
```

Phase 3 includes static executive identity data, QR code display, vCard download, call/email/website actions, restrained GSAP motion, responsive layout, and accessibility support.

## Phase 4 QR Interaction Event Ledger

Phase 4 records card interactions as structured events.

Event types:

- `qr_scan`
- `card_view`
- `vcard_download`
- `call_click`
- `email_click`
- `website_click`

Database migration:

```bash
database/migrations/0001_create_interaction_events.sql
```

Required runtime environment:

```bash
DATABASE_URL=postgres://...
BIDAYAX_IP_HASH_SECRET=replace-with-production-secret
```

Optional runtime environment:

```bash
DATABASE_SSL=true
PG_POOL_MAX=5
```

The card app posts events to:

```text
POST /api/events
```

Event logging is fail-open. If the API or database is unavailable, the card still loads and call, email, website, and vCard actions still work.

## Phase 5 Executive Interaction Dashboard

The first internal dashboard lives in `apps/dashboard`.

Run the dashboard:

```bash
pnpm --filter @bidayax/dashboard dev
```

Validate the dashboard:

```bash
pnpm --filter @bidayax/dashboard typecheck
pnpm --filter @bidayax/dashboard lint
pnpm --filter @bidayax/dashboard build
```

Runtime environment:

```bash
DATABASE_URL=postgres://...
DATABASE_SSL=true
PG_POOL_MAX=5
```

The dashboard reads `interaction_events` and shows:

- total interactions.
- card views.
- vCard downloads.
- call, email, and website clicks.
- activity by executive.
- activity by event type.
- recent anonymous interaction feed.
- 14-day activity trend.
- simple action conversion ratios.

If `DATABASE_URL` is missing or no events exist, the dashboard shows an honest empty state instead of fake metrics.

## Phase 6 Executive Intent Scoring Engine

The deterministic scoring service lives in `services/intent-scoring`.

Run scoring tests:

```bash
pnpm --filter @bidayax/intent-scoring test
```

Run manual recalculation:

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/intent-scoring recalculate
```

Database migration:

```bash
database/migrations/0002_create_intent_scores.sql
```

Scoring version:

```text
v1.0.0
```

Intent tiers:

- Cold Signal
- Warm Signal
- Qualified Signal
- Executive Priority
- Strategic Opportunity

The Phase 6 dashboard reads `intent_scores` and shows top anonymous intent signals, tier breakdowns, reason codes, and executive-level summaries. These are signals, not confirmed leads.

## Phase 7 Executive Contact Graph

The relationship graph service lives in `services/contact-graph`.

Run graph tests:

```bash
pnpm --filter @bidayax/contact-graph test
```

Run graph rebuild:

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/contact-graph rebuild
```

Database migration:

```bash
database/migrations/0003_create_contact_graph.sql
```

Phase 7 adds:

- `contact_graph_nodes`
- `contact_graph_edges`
- `contact_graph_snapshots`

The dashboard reads these tables and shows graph summaries, relationship snapshots, and engagement paths. Anonymous visitors remain anonymous. These are relationship signals, not contacts, leads, companies, or confirmed identities.

## Phase 8 Polyglot Receptionist OS Foundation

The receptionist foundation service lives in `services/receptionist-agent`.

Run receptionist tests:

```bash
pnpm --filter @bidayax/receptionist-agent test
```

Database migration:

```bash
database/migrations/0004_create_receptionist_foundation.sql
```

Phase 8 adds:

- `receptionist_interactions`
- `receptionist_tasks`
- `receptionist_conversation_turns`
- `receptionist_workflow_events`

The dashboard can read these tables and show simulated receptionist summaries, tasks, language breakdowns, and interaction feeds. Phase 8 does not connect live calling, email, calendars, Twilio, OpenAI Realtime, Gmail, Microsoft 365, or external workflow engines.

## Phase 9 Live Voice + Telephony Integration Preparation

The telephony preparation service lives in `services/telephony`.

Run telephony tests:

```bash
pnpm --filter @bidayax/telephony test
```

Database migration:

```bash
database/migrations/0005_create_telephony_preparation.sql
```

Phase 9 adds:

- `telephony_calls`
- `telephony_call_events`
- `voice_sessions`
- `outbound_call_requests`

Safe environment defaults:

```bash
TELEPHONY_PROVIDER=mock
VOICE_AGENT_ENABLED=false
OUTBOUND_CALLS_ENABLED=false
REQUIRE_HUMAN_APPROVAL=true
```

The dashboard can read these tables and show telephony readiness, call lifecycle events, voice session metadata, outbound approval requests, mock provider status, and safety gate status. Phase 9 does not execute real calls, Twilio calls, OpenAI Realtime sessions, real emails, or real calendar bookings.

## Repository Structure

```text
bidayax-executive-system/
+-- apps/
|   +-- card/
|   +-- dashboard/
|   +-- receptionist-console/
+-- packages/
|   +-- design-system/
|   +-- ui/
|   +-- tokens/
|   +-- config/
|   +-- types/
|   +-- sdk/
+-- services/
|   +-- api/
|   +-- contact-graph/
|   +-- event-ledger/
|   +-- intent-scoring/
|   +-- receptionist-agent/
|   +-- telephony/
|   +-- notification-worker/
+-- database/
|   +-- models/
|   +-- migrations/
|   +-- seeds/
+-- infrastructure/
|   +-- docker/
|   +-- caddy/
|   +-- hostinger-vps/
+-- agents/
+-- docs/
+-- README.md
```

## Intended Stack

The intended stack for the design-system foundation is:

- Monorepo with pnpm workspaces and TurboRepo
- Next.js, React, TypeScript, Tailwind CSS v4
- Storybook for design-system validation
- GSAP and Motion where motion adds clear product value
- Rust only where performance, reliability, or concurrency justify it
- PostgreSQL as the primary durable data store
- Redis only when a real latency, queueing, or caching need appears
- Docker, Caddy, and Hostinger VPS deployment

## Locked Phase 1 Decisions

- Identity-to-Intelligence Architecture is the governing architecture.
- Executive Intent Scoring is the first new algorithm to document and later validate.
- Executive Contact Graph is the core intelligence data structure.
- Design-System-to-Intelligence Supply Chain prevents the product from becoming branding-only.
- Event-first capture is the bridge between external interactions and executive insight.
- No screens, components, services, migrations, or receptionist logic are allowed before their phase gates.

## Locked Phase 2 Decisions

- All raw color values live in `packages/tokens`.
- UI components consume semantic classes and token-backed CSS variables.
- Storybook must document reusable primitives before screens exist.
- Application screens must be assembled from approved tokens and primitives.
- Phase 2 does not create business-card, dashboard, or receptionist-specific UI.

## Locked Phase 3 Decisions

- `apps/card` is the only Phase 3 application.
- Executive card data is static.
- QR codes route to the public card URLs.
- vCard export is generated client-side from typed data.
- GSAP motion is restrained, token-timed, and reduced-motion aware.
- No analytics, backend APIs, database logic, receptionist workflows, dashboard UI, auth, or admin features exist in Phase 3.

## Locked Phase 4 Decisions

- `interaction_events` is the first real database table.
- `POST /api/events` is the only Phase 4 ingestion API.
- Card route loads emit `card_view`; QR-marked card URLs also emit `qr_scan`.
- Card actions emit `vcard_download`, `call_click`, `email_click`, and `website_click`.
- Anonymous visitor IDs live in browser local storage; anonymous session IDs live in session storage.
- Raw IP addresses are never stored.
- Database failures return generic errors and never block card actions.
- No dashboard, CRM, receptionist, intent scoring, authentication, admin, payment, or recursive improvement implementation exists in Phase 4.

## Locked Phase 5 Decisions

- `apps/dashboard` is the only Phase 5 application.
- The dashboard reads from `interaction_events` only.
- No fake metrics, seeded analytics, or invented growth claims are shown.
- The dashboard exposes anonymous event data only and never shows raw IPs.
- Conversion summaries are simple ratios from `card_view` to action events.
- No CRM, receptionist, contact graph, lead scoring, intent scoring, scheduling, authentication, admin, payment, or recursive improvement implementation exists in Phase 5.

## Locked Phase 6 Decisions

- Scoring is deterministic and transparent.
- Scoring version is `v1.0.0`.
- Scores are grouped by anonymous visitor, session, and executive.
- `intent_scores` is derived from `interaction_events`.
- Reason codes explain every score.
- Dashboard language uses anonymous signals, not leads or contacts.
- No machine learning, CRM, receptionist, contact enrichment, scheduling, user accounts, autonomous decisions, or recursive improvement implementation exists in Phase 6.

## Locked Phase 7 Decisions

- The graph uses PostgreSQL relational tables, not a separate graph database.
- Nodes use stable keys so rebuilds are idempotent.
- Edges are typed and duplicate-protected.
- Snapshots are factual summaries of observed anonymous behavior.
- Dashboard language uses anonymous visitors, relationship snapshots, and engagement paths.
- No CRM, receptionist, external enrichment, contact/company records, identity guessing, sales pipeline, or automation implementation exists in Phase 7.

## Locked Phase 8 Decisions

- Receptionist behavior is simulated only.
- Intent classification is deterministic, not LLM-based.
- Escalation is a recommendation only and never contacts an executive automatically.
- Language profiles are metadata models, not claims of live fluency.
- Dashboard copy labels receptionist data as simulated/foundation data.
- No Twilio, OpenAI Realtime, Gmail, Microsoft 365, calendar, n8n, CRM, live calling, real email, real booking, or external workflow integration exists in Phase 8.

## Locked Phase 9 Decisions

- Telephony provider defaults to `mock`.
- Outbound calls are disabled by default.
- Voice agent execution is disabled by default.
- Human approval is required by default.
- Only a mock provider implementation exists.
- API routes scaffold inbound and outbound preparation but do not execute real provider calls.
- Dashboard phone numbers are masked.
- No real Twilio execution, OpenAI Realtime connection, live voice streaming, real email, calendar booking, CRM, enrichment, or autonomous voice behavior exists in Phase 9.

## Next Gate

Phase 10 should begin only after the Phase 9 Live Voice + Telephony Integration Preparation is reviewed and accepted. Phase 10 is Live Provider Integration + Voice Runtime Safety Gate.
