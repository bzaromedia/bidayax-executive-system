# Advisor Review Gate

Invoke the Advisor at these mandatory gates.

## Gate A: Architecture

Run before significant implementation begins.

Provide:

- interpreted objective
- relevant source-of-truth docs
- affected boundaries
- task graph
- major assumptions
- compatibility or migration risks

## Gate B: High-Risk Changes

Run before executing, or before requesting approval to execute, changes that touch:

- authentication or authorization
- tenant isolation
- cryptography
- secrets
- payments
- healthcare or regulated data
- database migrations
- irreversible operations
- public API contracts
- deployment infrastructure
- destructive commands
- significant dependency changes

If the change set is accepted and implemented, run a follow-up review before final completion.

## Gate C: Final Acceptance

Run after implementation and validation.

Provide:

- complete diff or changed-file set
- executed validation evidence
- security and database findings
- unresolved warnings
- documentation updates
- deviations from plan
- residual risks

Blocking rules:

- `REJECTED` blocks completion
- `APPROVED_WITH_CONDITIONS` blocks completion until mandatory conditions are resolved or explicitly accepted by the user