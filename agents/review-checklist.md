# Review Checklist

## Phase Boundary

- Is the work inside the requested phase?
- Are non-goals respected?
- Are no future-phase implementation files introduced early?
- Are acceptance criteria updated if scope changed?

## Source Of Truth

- Does the work preserve the system thesis?
- Did Codex read the relevant docs first?
- Were changed decisions reflected in docs?
- Are architecture decisions explainable?

## Product Thesis

- Does the work connect identity to interaction intelligence?
- Does it strengthen the event ledger, intent scoring, contact graph, receptionist workflow, dashboard, or follow-up loop?
- Does it avoid becoming a generic card, CRM, receptionist, or dashboard feature?

## Design Governance

- Are tokens defined before screens?
- Are components defined before app-specific UI?
- Are patterns documented when repeated?
- Are visual decisions routed through the design-system packages?
- Is accessibility considered?

## Engineering Quality

- Is the simplest complete solution used?
- Are abstractions justified by at least two use cases?
- Are dependencies justified?
- Are tests proportionate to risk?
- Is important behavior observable?
- Is error handling clear?

## Event And Data Quality

- Are important interactions represented as events?
- Are event sources and timestamps preserved?
- Is identity confidence separated from identity data?
- Is the contact graph updated from event facts?
- Are score outputs explainable?
- Are corrections and audit trails preserved?

## Security And Privacy

- Is personal data classified?
- Is access scoped by role?
- Is consent respected?
- Are sensitive automation actions reviewable?
- Are audit logs defined for important actions?
- Are secrets kept out of source control?

## Phase 1 Specific Review

- Required folders exist.
- Required docs exist.
- `agents/AGENTS.md` exists.
- No production UI code exists.
- No backend implementation exists.
- No database migration exists.
- No receptionist implementation exists.
- Research validation answers the core pass/fail questions.
