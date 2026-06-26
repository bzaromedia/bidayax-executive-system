# BidayaX Executive System

BidayaX Executive System is an Executive Identity Intelligence System. Its purpose is to turn every external business interaction into structured executive intelligence.

This repository is currently in Phase 1: Foundation, Research, and Architecture Lock-In. Phase 1 creates the source-of-truth documentation and monorepo structure only. It intentionally does not include production UI, backend services, database migrations, receptionist logic, or application code.

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

The intended stack is documented but not implemented in Phase 1:

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

## Next Gate

Phase 2 should begin only after Phase 1 is reviewed and accepted. The next phase is Design System Supply Chain Foundation.
