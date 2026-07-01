# Phase 6 Executive Intent Scoring Engine

## Goal

Phase 6 creates the first deterministic decision-intelligence layer for The Executive Card.

It ranks anonymous executive-card interaction groups using explainable rules and stores the results in `intent_scores`.

## Scope

Phase 6 includes:

- shared intent types.
- reason codes.
- tier definitions.
- pure scoring function.
- unit tests.
- `intent_scores` migration.
- manual recalculation pathway.
- dashboard intent-signal sections.
- documentation.

## Non-Goals

Phase 6 does not build:

- receptionist workflows.
- CRM functionality.
- scheduling.
- email automation.
- call automation.
- contact enrichment.
- user accounts.
- machine learning.
- autonomous AI decisions.
- recursive improvement implementation.

## Scoring Function

The pure scoring function lives in:

```text
services/intent-scoring/src/score-event-group.ts
```

It accepts grouped events plus a scoring timestamp and returns:

- score.
- tier.
- reason codes.
- scoring version.
- event count.
- first and last event timestamps.

The function is deterministic for identical input.

## Persistence

Migration:

```text
database/migrations/0002_create_intent_scores.sql
```

Table:

```text
intent_scores
```

The table stores one active score per anonymous visitor/session/executive combination.

## Recalculation

Manual recalculation:

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/intent-scoring recalculate
```

The recalculation path reads `interaction_events` and upserts `intent_scores`.

## Dashboard Updates

`apps/dashboard` now reads `intent_scores` and shows:

- top intent signals.
- tier breakdown.
- reason codes.
- executive-level intent summary.

The dashboard labels all rows as anonymous signals. It does not invent lead names, companies, or customer identities.

## Validation Questions

1. Does the scoring engine read real interaction behavior?
   Yes. It reads `interaction_events`.
2. Is the scoring logic deterministic?
   Yes. It is a pure TypeScript function with fixed rules.
3. Is the score explainable through reason codes?
   Yes. Every score includes reason codes.
4. Is privacy preserved?
   Yes. No raw IPs, identity inference, demographic inference, or enrichment are used.
5. Does the dashboard distinguish signals from confirmed leads?
   Yes. Dashboard labels use anonymous signal language.
6. Is the system simple enough to maintain?
   Yes. It uses one scoring package, one migration, and one manual recalculation path.
7. Is this enough to support future contact graph and receptionist workflows?
   Yes. Future phases can consume scores without changing event capture.
