# ADR-0001: Communications Completion Boundary

## Status

Proposed

## Date

2026-07-24

## Owners

- BidayaX LLC
- Active Phase 11 Executor

## Decision

If accepted, Phase 11 Communications Completion will use the Communications
Domain as the channel-neutral orchestration boundary. Telephony, voice,
messaging, scheduling, and future channels will be adapters below that boundary
and may not bypass Communications policy, consent, trust, or authorization
controls.

## Context

The repository contains earlier v1.0 hardening records and a current
`docs/phase-11/` plan that redefines active Phase 11 around Communications
Completion. PR #11 merged production-reconciliation tooling, but it did not
close Phase 11.

## Problem Statement

Communications work must not fragment across telephony, voice, receptionist,
and future channels. A durable architecture boundary is required before
remaining Phase 11 work continues.

## Scope

- Communications API and orchestrator boundary
- Channel adapter contracts
- Receptionist runtime policy boundary
- Consent, suppressions, kill switches, trust evidence, audit, and idempotency
- Phase 11 closure evidence requirements

## Non-Goals

- Live provider selection
- Credential provisioning
- Phone-number purchase
- Live inbound or outbound calls
- Live voice or messaging execution
- Deployment or production activation
- Wallet, payments, rewards, marketplace, or Version 2 implementation

## Alternatives Considered

- Keep telephony as the domain root. Rejected because Phase 11 requires a
  channel-neutral communications boundary.
- Implement provider-specific channels first. Rejected because it would choose
  integrations before policy, consent, and trust boundaries are complete.
- Treat PR #11 as Phase 11 closure. Rejected because PR numbers and phase
  numbers are independent and no closure record exists.

## Selected Architecture

The target architecture is:

Applications call a channel-neutral Communications API. The Communications
Orchestrator owns policy, routing, consent, suppressions, trust evidence,
idempotency, audit events, and observability. Channel adapters execute only
within orchestrator-approved boundaries.

Current migration state:

- Phase 11A documents and types the target Communications boundary.
- Legacy telephony still contains transport control-plane, authorization,
  idempotency, lifecycle, audit, usage, and trust behavior that must be cut over
  in governed Phase 11 subphases.
- Phase 11B through 11D must define data ownership, single-writer rules,
  compatibility/versioning, composition-root ownership, dual-write prevention,
  and rollback before implementation changes move authority out of telephony.
- `docs/ARCHITECTURE.md` must be updated to list `packages/communications-domain`
  and `services/communications` ownership when this ADR is accepted.

## Data and Control Flows

```text
Applications
-> Communications API
-> Communications Orchestrator
-> Channel Adapters
   -> Telephony
   -> Voice
   -> Messaging
   -> Scheduling
```

Commands must carry tenant and card scope. Events must be versioned and
auditable. Adapter responses must return through the orchestrator for state,
trust, and observability handling.

## Security Considerations

If accepted, the Communications Domain must fail closed on missing
authorization, tenant scope, card scope, consent, suppressions, kill-switch
state, replay protection, and provider safety state.

Every command must resolve the authenticated principal on the server. Caller
supplied tenant, card, role, and permission claims are non-authoritative.
Sensitive commands require command-specific permissions, resource ownership,
reason, and audit evidence. Platform kill switches require a platform
administrator or BidayaX LLC owner delegate.

Production execution remains disabled until the Phase 11I Communications
production activation gate is approved through a merged activation record by
the BidayaX LLC owner or an explicitly named production delegate.

Before that activation record exists, SSH, VPS, hosting-control-panel access,
production-data access, provider-console or provider-API access, credential
retrieval or provisioning, provider enablement, deployment, and live execution
are prohibited.

## Privacy Considerations

Communications records must minimize sensitive content, preserve consent and
suppression evidence, and follow repository retention and redaction policies.
Raw sensitive evidence must not be exposed in logs, docs, or public claims.

## Reliability Considerations

Commands must be idempotent. Adapter execution must be retry-safe. State changes
must be auditable. Rollback plans must keep production calls and provider
execution disabled unless separately authorized.

## Observability Requirements

Phase 11 must define channel-neutral events, metrics, failure states, safety
gate events, and operations dashboards before staging validation and production
activation are considered.

## Testing Strategy

Required tests include compile-time contract tests, orchestrator policy tests,
adapter boundary tests, authorization and tenant isolation tests, consent and
suppression tests, idempotency tests, database-backed tests where persistence is
introduced, and repository verification gates.

## Migration Strategy

Schema or data model changes belong to Phase 11B or later and must include
forward migration, rollback, database-backed validation, and closure evidence.
Phase 11A does not move database write authority.

Cutover from legacy telephony ownership must be staged through the governed
Phase 11 sequence. Each subphase must preserve compatibility, define the
composition root, prevent dual writers, and document rollback before
implementation begins.

## Rollback Strategy

Rollback must restore the last approved repository state and preserve disabled
production execution. No rollback procedure may require production provider
credentials or irreversible production actions without explicit approval.

## Dependencies

- `docs/phase-11/PHASE_11_MASTER_PLAN.md`
- `docs/phase-11/PHASE_11_SEQUENCE.md`
- `docs/phase-11/PHASE_11A_ACCEPTANCE_CRITERIA.md`
- `docs/phase-11/PRODUCTION_ACTIVATION_GATE.md`
- `docs/governance/PROJECT_CONSTITUTION.md`

## Risks

- Historical phase numbering can be confused with the active Phase 11 roadmap.
- Provider-specific urgency can pressure implementation before policy and
  consent are complete.
- Production reconciliation tooling can be mistaken for production activation.

## Acceptance Criteria

- Communications is documented as the domain root.
- Telephony is documented and typed as one channel adapter.
- Receptionist behavior cannot bypass Communications policy.
- Communications API and orchestrator contracts remain channel-neutral.
- Security boundaries and production-disabled behavior are explicit.
- Required tests, validation, and Advisor gates are recorded.

## Completion Evidence Requirements

- Accepted ADR coverage.
- Phase 11A closure record.
- Passing repository validation.
- Passing relevant security and authorization tests.
- Advisor approval for closure.
- Merge references for closure PRs.

## Consequences

If accepted, future Communications work must route through the Communications
Domain. Direct provider or channel implementation outside the boundary is
architecture drift.

## Future Impact

Phase 11B remains locked until Phase 11A closure. Phase 12 Production
Stabilization remains locked until all Phase 11 subphases and formal Phase 11
closure are complete. Wallet and other frozen capabilities remain out of scope.

## Related ADRs and Documents

- `docs/governance/ROADMAP.md`
- `docs/governance/CURRENT_PHASE_STATUS.md`
- `docs/phase-11/GAP_ANALYSIS.md`
- `docs/production-reconciliation/review-traceability.md`
