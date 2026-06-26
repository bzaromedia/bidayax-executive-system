# Engineering Methodology

## Method

BidayaX uses a simple, validation-first engineering methodology inspired by practical "build the simplest complete thing first" principles.

The project should favor working vertical slices, readable architecture, and measurable business outcomes over speculative platform work.

## Principles

1. Build the simplest complete version first.
2. Prefer working vertical slices over theoretical architecture.
3. Keep architecture understandable.
4. Minimize abstractions.
5. Minimize dependencies.
6. Do not create infrastructure before there is a real need.
7. Do not generalize until at least two concrete use cases justify it.
8. Optimize last.
9. Prioritize correctness, readability, maintainability, then performance.
10. Make every system observable.
11. Every phase must end with a demonstrable milestone.
12. Every feature must have measurable business value.
13. Use 30 percent ideation and 70 percent validation.
14. Research before inventing.
15. Build from reality, not speculation.

## How To Apply This

### Start With A Thin Loop

Each implementation phase should choose the smallest loop that demonstrates the system thesis. A valid loop includes capture, state, feedback, and a measurable outcome.

Example future vertical slice:

```text
QR scan
-> event ledger entry
-> contact candidate
-> intent score
-> dashboard insight
-> follow-up action
```

### Prefer Direct Models

Use direct domain objects before introducing broad frameworks. If the first two features only require a simple event envelope, do not build an event platform. If the first version only needs one scoring model, do not build a scoring rule engine.

### Require Evidence For Abstraction

An abstraction is allowed when:

- At least two real use cases need it.
- It removes visible duplication.
- It makes behavior easier to test.
- It keeps ownership boundaries clearer.
- It does not hide business rules.

### Require Evidence For Dependencies

A dependency is allowed when:

- It solves a concrete problem better than local code.
- It is maintained and compatible with the intended stack.
- It does not pull in unnecessary runtime complexity.
- It has a clear owner and upgrade path.
- It can be removed or isolated if it fails.

### Optimize After Correctness

Performance work should follow measurement. Early effort should make behavior correct, observable, and easy to reason about.

## Phase Discipline

Phase 1 creates foundation only. No production UI, services, migrations, receptionist logic, or app code are allowed.

Future phases must define:

- Scope.
- Non-goals.
- Acceptance criteria.
- Observable milestone.
- Measurable business value.
- Security and privacy impact.
- Required docs to update.

## Observability Rule

Every future feature should produce enough telemetry to answer:

- What happened?
- Who or what caused it?
- When did it happen?
- What system handled it?
- What was the outcome?
- What business metric can it affect?
- How can it be audited or replayed?

## Testing Rule

Every implementation must be testable. The kind of test depends on risk:

- Domain rules: unit tests.
- Event normalization: contract tests.
- Scoring behavior: fixture tests and explainability checks.
- API boundaries: integration tests.
- UI states: component and accessibility tests.
- Workflows: end-to-end tests for critical paths.

## Documentation Rule

Architecture decisions should be documented when they change:

- System thesis changes go in `docs/SYSTEM_THESIS.md`.
- Architecture changes go in `docs/ARCHITECTURE.md`.
- Algorithm changes go in `docs/ALGORITHMS.md`.
- Data model changes go in `docs/DATA_STRUCTURES.md` and `docs/DATABASE_MODEL.md`.
- Design governance changes go in `docs/DESIGN_SYSTEM_SUPPLY_CHAIN.md`.
- Operational rules go in `agents/AGENTS.md` and `agents/codex-rules.md`.

## Definition Of Done

A future implementation task is done only when:

- It satisfies the phase acceptance criteria.
- It preserves the system thesis.
- It has tests appropriate to its risk.
- It has observable outcomes.
- It updates source-of-truth documentation if behavior or architecture changed.
- It avoids speculative infrastructure.
