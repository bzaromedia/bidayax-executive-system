# Evidence-Weighted Variant Selection

Phase 13 uses deterministic scoring only.

```text
priority_score =
evidence_score
+ expected_impact
+ user_value
+ maintainability_gain
+ performance_gain
+ accessibility_gain
- implementation_risk
- regression_risk
- complexity_cost
```

## Score Components

- `evidence_score`: strength of telemetry evidence.
- `expected_impact`: size of expected metric improvement.
- `user_value`: estimated value to the executive/card/dashboard workflow.
- `maintainability_gain`: expected reduction in operational friction.
- `performance_gain`: expected performance benefit.
- `accessibility_gain`: expected accessibility benefit.
- `implementation_risk`: risk of making the change.
- `regression_risk`: risk of breaking existing behavior.
- `complexity_cost`: cost of implementation and review.

## Safety

Scores rank proposals. Scores do not implement, deploy, or approve anything by themselves.

Human approval and future sandbox validation are still required.
