# The Executive Card Dashboard App

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
- workflow interaction feed.
- receptionist task list.
- language breakdown.
- intent classification preview.

The dashboard must present these rows as workflow foundation records, not live calls, sent emails, booked meetings, or production receptionist actions.

## Phase 9 Telephony Readiness

When the telephony preparation tables exist, the dashboard also displays:

- telephony readiness summary.
- call lifecycle feed.
- voice session status.
- outbound call approval list.
- safety-gated future integration status.
- safety gate status.

The dashboard must present these rows as preparation data, not production calling activity. Phone numbers should be masked.

## Phase 10 Live Provider Readiness

The dashboard also displays:

- live provider readiness.
- Twilio configuration checklist.
- OpenAI Realtime readiness.
- voice runtime safety gate.
- test-call mode status.
- production call warning.
- blocked reason codes.

The dashboard must present Phase 10 as safety-gated readiness, not autonomous production voice operation. It must not display secrets.

API routes:

- `GET /api/live-provider/readiness`
- `POST /api/live-provider/voice-runtime`
- `POST /api/telephony/twilio/inbound`

## Phase 12 Observability

The dashboard also displays:

- observability summary.
- recent telemetry events.
- system metric cards.
- normalized error events.
- safety gate telemetry.
- subsystem health matrix.

Observability route:

- `/observability`

Telemetry API routes:

- `POST /api/telemetry/events`
- `POST /api/telemetry/metrics`
- `GET /api/telemetry/summary`

The dashboard must show real telemetry only. If no telemetry exists, it shows an empty state instead of invented uptime, invented metrics, or invented coverage.

## Phase 13 Improvement Engine

The dashboard also displays:

- improvement engine summary.
- detected telemetry-backed opportunities.
- candidate review list.
- evidence score.
- risk score.
- lineage archive.
- human approval gate status.

Improvement route:

- `/improvement-engine`

Improvement API routes:

- `GET /api/improvement-engine/opportunities`
- `POST /api/improvement-engine/opportunities/detect`
- `GET /api/improvement-engine/candidates`
- `POST /api/improvement-engine/candidates/generate`
- `POST /api/improvement-engine/approval`
- `GET /api/improvement-engine/summary`

The dashboard must present candidates as proposals only. It must not claim automatic implementation, production deployment, self-improvement, or autonomous agent completion.

## Phase Boundaries

This app must not include CRM functionality, autonomous receptionist workflows, lead records, contact enrichment, scheduling, user accounts, complex permissions, invented analytics, unrestricted live calling, or recursive improvement automation.
