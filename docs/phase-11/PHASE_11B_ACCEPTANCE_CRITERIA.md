# Phase 11B Acceptance Criteria

Status: Accepted when PR #14 is merged
Date: 2026-07-25

Phase 11B is not implemented by this document. These criteria define the bar
for a later authorized Phase 11B implementation and closure record.

Phase 11B is complete only when:

- PR #14 is merged.
- ADR-0002 or a superseding Communications Data Model ADR is Accepted and
  effective.
- Every Phase Gate Policy entry requirement is evidenced before
  implementation begins.
- An owner-approved implementation plan records the authorized file scope and
  work-package order.
- Communications-owned entities and aggregates are defined.
- Existing telephony and trust table reuse, extension, deprecation,
  quarantine, or adapter-local decisions are recorded table by table.
- Legacy `0005_create_telephony_preparation.sql` writes are quarantined or made
  tenant-safe before Communications-owned writes use them.
- Tenant isolation is enforced for all Communications-owned rows.
- Card scope is enforced where applicable with tenant/card constraints.
- Every tenant-owned relationship uses database-enforced tenant-composite
  references, plus card scope where applicable.
- Single-writer ownership is explicit.
- Dual-write prevention is explicit.
- Product identifiers are separated from provider references.
- Command idempotency is durable and retry-safe.
- Canonical lifecycle transitions are owned by Communications.
- Adapter transport states are normalized before policy effects.
- Consent records are versioned, jurisdiction tagged, evidence-linked, and
  revocable.
- Consent policies are separated from immutable participant consent
  observations or receipts.
- Missing, expired, ambiguous, purpose-mismatched, channel-mismatched, stale, or
  revoked consent denies dispatch.
- Suppression records are fail-closed and auditable.
- Audit records include denied actions and are append-only or equivalently
  immutable.
- Trust evidence links only sanitized communication facts.
- Communications trust domains, artifact schemas, canonicalization versions,
  key purposes, tenant-composite links, and field allowlists are defined.
- Raw transcripts, raw audio, provider secrets, private keys, authorization
  tokens, and raw provider payloads are excluded from trust evidence.
- Raw webhook bodies and raw provider payload bytes are transient verification
  inputs by default.
- Durable webhook evidence stores only hashes, provider event identifiers,
  verification results, timestamps, and sanitized metadata unless a later
  accepted implementation package documents legal basis, segregated encryption,
  strict access control, short TTL, deletion evidence, and rollback behavior.
- Actors bind to authoritative user, service, or platform principal evidence,
  tenant memberships, card grants where applicable, session or delegated
  authority context, authorization decision IDs, permission versions, policy
  versions, denial evidence, and audit events.
- Retention and deletion requirements are defined.
- Migration and rollback or corrective roll-forward evidence is complete.
- A named PostgreSQL validation gate applies the full migration chain and tests
  constraints, tenant isolation, immutability, concurrency, idempotency,
  rollback or roll-forward safety, dual-write prevention, provider credential
  absence, and disabled dispatch.
- Database-backed validation passes.
- Security and authorization tests pass.
- Repository validation passes.
- Advisor approval is recorded.
- A Phase 11B closure record is accepted and merged.

No Phase 11B implementation is authorized until PR #14 is merged, the planning
ADR is Accepted and effective, every entry requirement is evidenced, and an
implementation package is explicitly approved.
