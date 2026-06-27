# BidayaX Dashboard App

The dashboard is the internal intelligence surface for card interaction events, intent signals, and anonymous contact graph summaries.

## Routes

- `/interactions`

## Run

```bash
pnpm --filter @bidayax/dashboard dev
```

The dashboard runs on port `3001`.

## Validate

```bash
pnpm --filter @bidayax/dashboard typecheck
pnpm --filter @bidayax/dashboard lint
pnpm --filter @bidayax/dashboard build
```

## Runtime

```bash
DATABASE_URL=postgres://...
DATABASE_SSL=true
PG_POOL_MAX=5
```

`DATABASE_SSL` and `PG_POOL_MAX` are optional.

## Phase 5 Scope

The dashboard reads real `interaction_events` data and displays:

- total interaction counts.
- event-type counts.
- executive counts.
- recent anonymous interactions.
- 14-day activity counts.
- simple conversion ratios.

If the database is not configured, unavailable, or empty, the dashboard shows an honest empty state.

## Phase 6 Intent Signals

When `intent_scores` exists, the dashboard also displays:

- top anonymous intent signals.
- intent tier breakdown.
- reason codes.
- executive-level intent summary.

Run scoring recalculation from the service package:

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/intent-scoring recalculate
```

The dashboard must present these rows as anonymous signals, not confirmed leads.

## Phase 7 Contact Graph

When the contact graph tables exist, the dashboard also displays:

- contact graph summary.
- executive relationship snapshots.
- engagement paths.
- graph empty state.

Run graph rebuild from the service package:

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/contact-graph rebuild
```

The dashboard must present these rows as anonymous relationship signals, not contacts, companies, leads, or verified identities.

## Phase 8 Receptionist Foundation

When the receptionist foundation tables exist, the dashboard also displays:

- receptionist foundation summary.
- simulated interaction feed.
- receptionist task list.
- language breakdown.
- intent classification preview.

The dashboard must present these rows as simulated foundation records, not live calls, sent emails, booked meetings, or production receptionist actions.

## Phase 9 Telephony Readiness

When the telephony preparation tables exist, the dashboard also displays:

- telephony readiness summary.
- call lifecycle feed.
- voice session status.
- outbound call approval list.
- mock provider status.
- safety gate status.

The dashboard must present these rows as preparation data, not production calling activity. Phone numbers should be masked.

## Phase Boundaries

This app must not include CRM functionality, receptionist workflows, lead records, contact enrichment, scheduling, user accounts, complex permissions, fake analytics, or recursive improvement automation.
