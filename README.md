# The Executive Card

The Executive Card is a digital executive identity and interaction platform owned by BidayaX LLC.

Production URL: https://theexecutivecard.online

## Current Scope

This repository is in Recovery Phase 0: repository stabilization and rename alignment. It currently contains the implemented foundation for:

- digital executive card app;
- interaction event ledger;
- internal interaction dashboard;
- intent scoring;
- executive contact graph;
- receptionist simulation foundation;
- telephony preparation and voice safety gates;
- telemetry and observability foundation;
- governed improvement-engine proposal workflow;
- design tokens, UI primitives, and Storybook design-system assets.

The repository does not currently implement the later enterprise trust, bank, IP, commercialization, certification, or policy-enforcement packages. Those phases remain out of scope until the recovery phases restore a clean build and package graph.

## Applications

- `apps/card`: public The Executive Card experience.
- `apps/dashboard`: internal dashboard for implemented ledger, graph, telephony, telemetry, and improvement-engine views.
- `apps/receptionist-console`: placeholder only.

## Packages

- `packages/tokens`: design tokens.
- `packages/ui`: shared UI primitives.
- `packages/design-system`: Storybook and design-system documentation.
- `packages/types`: shared types for implemented phases.
- `packages/config`: shared runtime configuration helpers.
- `packages/sdk`: placeholder only.

## Services

- `services/intent-scoring`
- `services/contact-graph`
- `services/receptionist-agent`
- `services/telephony`
- `services/telemetry`
- `services/improvement-engine`

Placeholder or blocked service directories are documented in `docs/PHASE_STATUS.md`.

## Setup

```powershell
pnpm install
```

## Verification

```powershell
pnpm db:migrations:verify
pnpm typecheck
pnpm test
pnpm build
```

Additional implemented checks:

```powershell
pnpm verify:production
pnpm telemetry:verify
pnpm improvement:verify
```

Database-backed scripts require `DATABASE_URL`.

## Safety Notes

- Production voice calls are disabled by default.
- Mock telephony remains the default provider unless explicitly configured.
- Human approval remains required for outbound/production voice paths.
- Telemetry helpers redact secret-like keys and mask phone numbers.
- Missing Phase 14-24 enterprise layers must not be treated as implemented.

## Phase Status

See `docs/PHASE_STATUS.md` for the current implemented, partial, missing, and blocked phase matrix.

## Repository Rules

- Do not commit `node_modules`, `.next`, `.pnpm-store`, `pnpm-store`, `dist`, `storybook-static`, or local environment files.
- Keep public naming aligned to The Executive Card.
- Keep BidayaX LLC as owner/company attribution where appropriate.
- Do not add new architecture during Recovery Phase 0.
