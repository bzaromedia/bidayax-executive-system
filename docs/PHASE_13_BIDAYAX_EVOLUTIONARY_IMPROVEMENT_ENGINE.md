# Phase 13: BidayaX Evolutionary Improvement Engine

## What Changed

Phase 13 adds the first controlled improvement foundation.

Created:

- `improvement_opportunities`
- `improvement_candidates`
- `improvement_lineage_archive`
- `improvement_approval_events`
- `services/improvement-engine`
- dashboard `/improvement-engine`
- improvement engine API routes
- operational scripts

## Validation Questions

1. Are improvement opportunities backed by telemetry?
   Yes. The detector uses telemetry summaries and returns no opportunity when evidence is below threshold.
2. Are candidates structured and explainable?
   Yes. Every candidate has title, hypothesis, target subsystem, expected metric, scores, and reason codes.
3. Are scores deterministic?
   Yes. Evidence-weighted priority and risk scores are pure TypeScript functions.
4. Are risks visible?
   Yes. Risk score is stored, displayed, and elevated for telephony, safety, security, database, and rollback concerns.
5. Is human approval mandatory?
   Yes. Candidates cannot be considered approved without an approval event.
6. Is lineage archived?
   Yes. Every generated candidate receives a lineage archive record.
7. Are fake metrics prevented?
   Yes. Phase 13 leaves `metrics_after`, `test_results`, and `benchmark_results` null.
8. Is production code untouched by the engine?
   Yes. The engine proposes only.
9. Is Phase 14 implemented?
   No. Recovery Phase 0 marks Phase 14 as not implemented until the repository is stable and the missing package scope is rebuilt deliberately.

## Explicitly Unbuilt

- self-modifying code
- autonomous deployment
- A/B testing
- production rollout
- recursive agent swarm
- voice/provider activation
- automatic UI or schema mutation
