# Telephony Provider Cost Reconciliation

## Current State

Phase 7G does not create carrier costs. The sandbox adapter never contacts a paid provider and never places live calls.

## Cost Evidence

Sandbox provider references are deterministic test references and must not be billed. Usage and cost ledger entries remain provider-neutral until a future live provider integration supplies verified cost events.

## Future Requirements

Before live calling, provider cost reconciliation must include:

- provider call identifier mapping
- tenant and card ownership
- minutes and billable increments
- provider fees
- AI runtime fees where applicable
- failed-call classification
- duplicate event handling
- spend limits and kill switches
- monthly reconciliation reports