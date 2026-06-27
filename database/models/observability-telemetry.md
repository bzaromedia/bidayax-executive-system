# Observability Telemetry Model

Phase 12 adds database-backed telemetry tables for local and production-lite
observability.

## telemetry_events

Stores structured operational and product usage events. Examples include
dashboard views, API completion, event ledger writes, scoring runs, graph
builds, receptionist simulations, readiness checks, and safety gate evaluation.

## telemetry_metrics

Stores metric snapshots such as API latency, dashboard query duration, event
counts, graph build duration, and safety gate block counts.

## telemetry_error_events

Stores normalized safe errors. It does not store stack traces, secrets, raw
provider payloads, raw audio, raw recordings, raw IP addresses, or payment data.

## telemetry_safety_gate_events

Stores safety gate decisions and reason codes so blocked voice/provider behavior
is visible before any future improvement engine uses the data.

## Retention

Recommended default retention:

- `telemetry_events`: 90 days
- `telemetry_metrics`: 180 days
- `telemetry_error_events`: 180 days
- `telemetry_safety_gate_events`: 365 days

Phase 12 reports retention status but does not delete data automatically.

