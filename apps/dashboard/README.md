# BidayaX Dashboard App

Phase 5 creates the first internal dashboard for card interaction events.

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

## Phase Boundaries

This app must not include CRM functionality, receptionist workflows, lead scoring, intent scoring, scheduling, user accounts, complex permissions, fake analytics, or recursive improvement automation.
