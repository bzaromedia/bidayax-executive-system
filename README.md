# BidayaX Executive System

BidayaX Executive System is an Executive Identity Intelligence System. Its purpose is to turn every external business interaction into structured executive intelligence.

This repository has completed Phase 1: Foundation, Research, and Architecture Lock-In; Phase 2: Design System Supply Chain Foundation; and Phase 3: Executive Digital Business Card Vertical Slice.

Phase 3 creates the first visible product surface: a static, luxury executive digital business card app. It intentionally does not include dashboard analytics, receptionist UI, backend services, database migrations, receptionist logic, CRM workflows, authentication, or production deployment automation.

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
|   +-- event-ledger/
|   +-- intent-scoring/
|   +-- receptionist-agent/
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

## Next Gate

Phase 4 should begin only after the Phase 3 card vertical slice is reviewed and accepted. Phase 4 is QR Interaction Event Ledger.
