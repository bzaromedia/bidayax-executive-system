# Observability & Telemetry Layer

Phase 12 adds a self-hosted measurement foundation for BidayaX Executive
System. It records operational, reliability, performance, product usage, and
safety-gate signals without changing system behavior.

## Implemented Levels

1. Local
   PostgreSQL telemetry tables and local scripts.

2. Production-lite
   Structured logs, PostgreSQL telemetry, health/readiness endpoints, and the
   `/observability` dashboard page.

## Not Implemented

- Recursive improvement.
- Autonomous agents.
- A/B testing.
- Automatic code changes.
- Automatic deployment.
- Required external monitoring SaaS.

## Tables

- `telemetry_events`
- `telemetry_metrics`
- `telemetry_error_events`
- `telemetry_safety_gate_events`

## Commands

```bash
pnpm telemetry:smoke
pnpm telemetry:verify
pnpm telemetry:retention
pnpm verify:observability
```

The telemetry scripts require `DATABASE_URL`.

