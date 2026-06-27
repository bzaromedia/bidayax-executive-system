# BidayaX Telemetry Service

`@bidayax/telemetry` is the Phase 12 measurement package for BidayaX Executive System.

It creates privacy-safe telemetry records for major system behavior:

- structured telemetry events
- metric snapshots
- normalized error records
- safety gate decisions
- deterministic aggregation helpers
- metadata sanitization

The package does not improve the system automatically. It does not create recursive agents, deploy variants, run A/B tests, or mutate production behavior.

## Package Boundary

This service is reusable by apps and domain services. It intentionally stays independent of Next.js UI code.

Core modules:

- `telemetry-event.ts`: creates typed telemetry event records.
- `telemetry-metric.ts`: creates metric snapshots.
- `telemetry-error.ts`: creates sanitized error telemetry.
- `telemetry-safety-gate.ts`: records safety gate decisions.
- `telemetry-sanitizer.ts`: removes secrets, tokens, raw IPs, and unsafe payload fields.
- `telemetry-writer.ts`: writes telemetry to PostgreSQL with fail-open behavior.
- `telemetry-aggregator.ts`: aggregates telemetry records for dashboard views.

## Safe Defaults

Telemetry must never store:

- secrets
- API keys
- auth tokens
- raw IP addresses
- raw provider payloads
- raw call recordings
- raw audio
- payment data
- sensitive personal traits

Phone-like values and secret-like fields are masked or removed when metadata is sanitized.

## Run Tests

```bash
pnpm --filter @bidayax/telemetry test
pnpm --filter @bidayax/telemetry typecheck
```

## Verify Phase 12

From the repository root:

```bash
pnpm verify:observability
```

Database-backed smoke tests require `DATABASE_URL` and the Phase 12 migration:

```bash
pnpm telemetry:verify
pnpm telemetry:smoke
pnpm telemetry:retention
```

## Future Use

Phase 13 may consume telemetry as evidence for proposed improvements, but this package does not select, approve, or deploy improvements. Any future evolutionary engine must remain sandbox-first, lineage-tracked, peer-reviewed, and human-approved before production release.
