# Communications Domain Architecture

## Goal

Establish a channel-neutral Communications Domain that owns business policy and orchestration, while adapters own transport behavior only.

## Layering

```text
apps/card + apps/dashboard
-> Communications API
-> Communications Orchestrator
-> Domain policies + state machines + repositories
-> Channel adapter registry
-> Sandbox or future live adapters
```

## Domain-Owned Responsibilities

- authorize actor, tenant, and card scope
- evaluate consent, suppressions, and business hours
- coordinate receptionist intent with communication policy
- choose an allowed channel
- choose an eligible adapter
- create idempotent commands
- persist lifecycle state transitions
- emit audit and trust evidence
- dispatch sandbox work
- classify retries and terminal failures
- enforce platform and tenant kill switches

## Adapter-Owned Responsibilities

- normalize transport-native requests and responses
- translate provider event formats
- report transport health
- expose transport capability metadata
- preserve adapter-local idempotency semantics

Adapters must not own:

- tenant authorization
- consent policy
- receptionist routing policy
- cross-channel orchestration
- production activation authority

## Structural Placement

- `packages/communications-domain/` — canonical domain contracts
- `services/communications/` — API and orchestration interfaces
- `services/telephony/` — telephony adapter implementation boundary
- `services/polyglot-receptionist/` — receptionist intent and escalation boundary
