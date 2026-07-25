# Phase 11B Acceptance Criteria

Status: Planning draft
Date: 2026-07-25

Phase 11B is not implemented by this document. These criteria define the bar
for a later authorized Phase 11B implementation and closure record.

Phase 11B is complete only when:

- ADR-0002 or a superseding Communications Data Model ADR is Accepted.
- Communications-owned entities and aggregates are defined.
- Existing telephony and trust table reuse or extension decisions are recorded.
- Tenant isolation is enforced for all Communications-owned rows.
- Card scope is enforced where applicable with tenant/card constraints.
- Single-writer ownership is explicit.
- Dual-write prevention is explicit.
- Product identifiers are separated from provider references.
- Command idempotency is durable and retry-safe.
- Canonical lifecycle transitions are owned by Communications.
- Adapter transport states are normalized before policy effects.
- Consent records are versioned, jurisdiction tagged, evidence-linked, and
  revocable.
- Suppression records are fail-closed and auditable.
- Audit records include denied actions and are append-only or equivalently
  immutable.
- Trust evidence links only sanitized communication facts.
- Raw transcripts, raw audio, provider secrets, private keys, authorization
  tokens, and raw provider payloads are excluded from trust evidence.
- Retention and deletion requirements are defined.
- Migration and rollback evidence is complete.
- Database-backed validation passes.
- Security and authorization tests pass.
- Repository validation passes.
- Advisor approval is recorded.
- A Phase 11B closure record is accepted and merged.

No Phase 11B implementation is authorized until the planning ADR is accepted
and an implementation package is explicitly approved.
