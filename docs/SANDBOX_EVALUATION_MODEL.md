# Sandbox Evaluation Model

Phase 13 does not implement sandbox execution yet.

It prepares every candidate for future sandbox evaluation by requiring:

- evidence summary
- expected metric
- risk score
- rollback plan
- lineage entry
- approval status

## Future Sandbox Requirements

Future phases should verify candidates in an isolated environment before production work.

The sandbox should measure:

- metrics before
- metrics after
- test results
- benchmark results
- regression risk
- rollback viability

## Phase 13 Boundary

`metrics_after`, `test_results`, and `benchmark_results` stay null in Phase 13 because no sandbox execution has occurred.
