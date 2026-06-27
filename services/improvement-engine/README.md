# BidayaX Evolutionary Improvement Engine

`@bidayax/improvement-engine` is the Phase 13 controlled improvement package.

It converts telemetry summaries into evidence-backed improvement opportunities, proposed candidates, deterministic scores, risk scores, lineage entries, and human approval-gate decisions.

It does not:

- rewrite code
- deploy changes
- run production experiments
- create agent swarms
- bypass voice or provider safety gates
- invent metrics after a candidate is proposed

## Run

```bash
pnpm --filter @bidayax/improvement-engine test
pnpm --filter @bidayax/improvement-engine typecheck
```

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

Approved candidates are still only ready for future sandbox implementation. Approval does not deploy anything.
