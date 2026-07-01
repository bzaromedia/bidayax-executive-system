# The Executive Card

The Executive Card is a digital executive identity and interaction platform owned by BidayaX LLC.

Production URL: https://theexecutivecard.online

## Current Scope

This repository has passed Recovery Phase A and Recovery Phase B. The v1.0 release scope contains the implemented, tested, and buildable foundation for:

- digital executive card app;
- interaction event ledger;
- internal interaction dashboard;
- intent scoring;
- executive contact graph;
- receptionist workflow foundation;
- safety-gated future telephony integration and voice safety gates;
- telemetry and observability foundation;
- governed improvement-engine proposal workflow;
- data-trust and policy-enforcement foundations;
- design tokens, UI primitives, and Storybook design-system assets.

The repository does not currently implement the later enterprise bank, IP, verification-layer, commercialization, certification, or full continuous-reverification systems. Those phases are deferred to v1.1+ unless future source, tests, migrations, API wiring, docs, and release verification are added.

The Executive Card v1.0 includes only implemented, tested, production-buildable capabilities. Deferred enterprise trust layers are not active product capabilities in v1.0.

## Applications

- `apps/card`: public The Executive Card experience.
- `apps/dashboard`: internal dashboard for implemented ledger, graph, safety-gated telephony readiness, telemetry, and human-approved recommendation views.

## Packages

- `packages/tokens`: design tokens.
- `packages/ui`: shared UI primitives.
- `packages/design-system`: Storybook and design-system documentation.
- `packages/types`: shared types for implemented phases.
- `packages/config`: shared runtime configuration helpers.

## Services

- `services/intent-scoring`
- `services/contact-graph`
- `services/receptionist-agent`
- `services/telephony`
- `services/telemetry`
- `services/improvement-engine`
- `services/policy-enforcement`

Deferred service ideas are documented privately in `docs/roadmap/DEFERRED_RELEASE_SCOPE.md`.

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
pnpm verify:no-missing-workspaces
pnpm verify:public-claims
pnpm verify:design-governance
pnpm verify:release-scope
pnpm verify:no-placeholders
pnpm telemetry:verify
pnpm improvement:verify
```

Database-backed scripts require `DATABASE_URL`.

## Safety Notes

- Production voice calls are disabled by default.
- Telephony is a safety-gated future integration unless separately configured and approved for production.
- Human approval remains required for outbound/production voice paths.
- Telemetry helpers redact secret-like keys and mask phone numbers.
- Deferred Phase 14-24 enterprise layers must not be treated as implemented.
- Policy-enforcement code is deterministic foundation code, not a completed enterprise trust fabric.

## Phase Status

See `docs/PHASE_STATUS.md` for the current implemented, partial, deferred, blocked, and removed-from-release-scope phase matrix.

See `docs/RELEASE_SCOPE.md` for the v1.0 production release boundary.

## Repository Rules

- Do not commit `node_modules`, `.next`, `.pnpm-store`, `pnpm-store`, `dist`, `storybook-static`, or local environment files.
- Keep public naming aligned to The Executive Card.
- Keep BidayaX LLC as owner/company attribution where appropriate.
- Keep recovery work scoped; do not resume the enterprise roadmap until the recovery phases are complete.
