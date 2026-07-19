# Phase 11 Master Plan

## Status

Phase 11A establishes the Communications Domain as the permanent orchestration boundary for The Executive Card™.

This document supersedes the earlier planning assumption that `services/telephony` is the permanent communications execution authority.

Historical context is preserved:

- Phase 9 created a telephony preparation layer.
- Phase 10 preserved production-disabled provider readiness and trust evidence boundaries.
- Phase 11A lifts the domain root above telephony into a channel-neutral communications architecture.

## Permanent Model

```text
Applications
-> Communications API
-> Communications Orchestrator
-> Channel Adapters
   - Telephony
   - Voice
   - Messaging
   - Scheduling
   - Future Adapters
```

## Ownership Decision

The Communications Domain owns:

- identity-bound authorization
- tenant and card scope
- communication policy
- receptionist coordination
- routing
- channel selection
- consent
- suppressions
- business-hours decisions
- participant normalization
- lifecycle orchestration
- audit events
- trust evidence
- command idempotency
- fraud and abuse boundaries
- platform and tenant kill switches
- channel-neutral observability

Telephony is one adapter, not the domain root.

## Phase 11 Sequence

- 11A — Communications Domain Architecture
- 11B — Communications Data Model
- 11C — Orchestration Runtime
- 11D — Telephony Adapter (Sandbox)
- 11E — Receptionist Runtime
- 11F — Security, Consent & Trust
- 11G — Observability & Operations
- 11H — Staging Validation
- 11I — Production Activation

## Phase 11A Scope

Phase 11A may add:

- architecture documentation
- domain contracts
- adapter contracts
- orchestrator interfaces
- event and error taxonomies
- ownership maps
- compile-time tests
- architecture boundary tests

Phase 11A may not add:

- live provider execution
- provider credentials
- number provisioning
- real webhook execution
- production calling
- production voice
- deployment
