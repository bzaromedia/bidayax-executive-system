# The Executive Card

The Executive Card is a digital executive identity and interaction platform owned by BidayaX LLC.

Production URL: https://theexecutivecard.online

## Current Scope

This repository is in Recovery Phase 1: missing trust package rebuild. It currently contains the implemented foundation for:

- digital executive card app;
- interaction event ledger;
- internal interaction dashboard;
- intent scoring;
- executive contact graph;
- receptionist simulation foundation;
- telephony preparation and voice safety gates;
- telemetry and observability foundation;
- governed improvement-engine proposal workflow;
- rebuilt data-trust and policy-enforcement foundations;
- design tokens, UI primitives, and Storybook design-system assets.

The repository does not currently implement the later enterprise bank, IP, commercialization, certification, or full continuous-reverification systems. Those phases remain out of scope until the recovery phases restore the missing trust foundations deliberately and keep the build graph clean.

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
- `services/policy-enforcement`

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
- Recovery Phase 1 policy-enforcement code is deterministic foundation code, not a completed enterprise trust fabric.

## Phase Status

See `docs/PHASE_STATUS.md` for the current implemented, partial, missing, and blocked phase matrix.

## Repository Rules

- Do not commit `node_modules`, `.next`, `.pnpm-store`, `pnpm-store`, `dist`, `storybook-static`, or local environment files.
- Keep public naming aligned to The Executive Card.
- Keep BidayaX LLC as owner/company attribution where appropriate.
- Keep recovery work scoped; do not resume the enterprise roadmap until the recovery phases are complete.
