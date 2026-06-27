# BidayaX Evolutionary Improvement Engine

Phase 13 creates a controlled, telemetry-driven recommendation engine.

It observes Phase 12 telemetry, detects improvement opportunities, generates candidates, scores evidence and risk, archives lineage, and requires human approval before any future implementation work.

## Implemented Scope

- Deterministic opportunity detection.
- Structured improvement candidates.
- Evidence-weighted priority scoring.
- Risk scoring.
- Lineage archive records.
- Human approval events.
- Dashboard visibility.
- API and script entry points.

## Safety Boundary

The engine does not modify code, deploy changes, run experiments, activate voice providers, or create autonomous agents.

Approved candidates mean only this:

```text
Approved for future sandbox implementation consideration.
```

They do not mean production promotion, live release, autonomous completion, or automatic optimization.

## Lifecycle

```text
Observe telemetry
Generate opportunity
Generate candidate
Score evidence and risk
Archive lineage
Require human approval
Stop before implementation
```

## Evidence Requirements

Opportunities must be backed by telemetry such as API latency, safety gate blocks, normalized errors, card conversion ratios, configuration failures, or telephony readiness failures.

No opportunity should be created from vibes, speculation, or fake metrics.
