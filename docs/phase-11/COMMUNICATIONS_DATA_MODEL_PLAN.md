# Communications Data Model Plan

Status: Accepted when PR #14 is merged
Phase: 11B

## Principle

Phase 11 must reconcile with the existing communications-related storage
foundation without creating dual writers or parallel overlapping ownership.
Communications owns the canonical product data model; Telephony remains an
adapter boundary for transport metadata.

This plan does not authorize migrations, schema changes, generated clients,
runtime code, provider activation, deployment, or production data access.

## Existing Storage Inventory

- `database/migrations/0005_create_telephony_preparation.sql` contains earlier
  telephony call, call-event, voice-session, and outbound-call-request tables.
- `database/migrations/0016_create_telephony_domain_foundation.sql` contains
  the richer telephony domain foundation: phone numbers, call sessions, queues,
  callback requests, appointment requests, transcript metadata, voice profiles,
  recording metadata, voicemails, routing rules, escalation policies, consent
  policies, emergency policy signals, idempotency keys, usage ledger, and audit
  events.
- `database/migrations/0017_create_cryptographic_trust_layer.sql` contains the
  cryptographic trust persistence boundary for signed actions, trust events,
  envelopes, audit-chain entries, Merkle evidence, provenance, receipts, and
  proofs.

## Reuse / Extend / Add

- Decide table by table whether each existing telephony table is reused,
  extended, deprecated, quarantined, or left adapter-local.
- Quarantine `database/migrations/0005_create_telephony_preparation.sql` as
  legacy preparation evidence unless a later implementation package proves
  tenant scoping, ownership, and rollback safety for any reused write path.
- Treat `telephony_phone_numbers` as adapter-local capability metadata.
  Communications may reference it only through tenant-composite constraints.
- Treat `telephony_callback_requests` as legacy callback evidence. Phase 11B
  must not make it a new Communications write target without a superseding
  cutover decision.
- Treat `telephony_call_sessions` as adapter-local transport session metadata.
  Communications lifecycle state must live in Communications-owned aggregates
  and may link to adapter sessions only by tenant-composite reference.
- Treat `telephony_call_recordings` and `telephony_call_transcripts` as
  adapter-local metadata only; raw audio and raw transcripts remain prohibited.
- Split consent policy records from participant consent observations or
  receipts before relying on consent for dispatch.
- Treat `telephony_audit_events` as adapter-local audit evidence.
  Communications audit must use a Communications-owned boundary or safe
  tenant-composite references.
- Add participants, state transitions, attempts, suppressions, business-hours
  policies, webhook evidence, summaries, provider health, failover evidence,
  and trust evidence references where the implementation plan proves single
  writer ownership.

## Storage Rules

- all rows tenant-scoped
- composite card FKs where applicable
- tenant-composite FKs on every tenant-owned relationship
- authoritative identity, membership, session, grant, policy, and authorization
  decision references for actors
- immutable audit and lifecycle evidence
- separate consent policies from immutable participant consent evidence
- missing, expired, mismatched, stale, ambiguous, or revoked consent denies
  dispatch
- durable idempotency keys
- raw webhook/provider bytes are transient by default and may not enter audit,
  trust, observability, or dashboard records
- no provider secrets in application tables
- no raw transcript or raw audio in trust evidence
- exact Communications trust domains, canonicalization versions, artifact
  schemas, key purposes, tenant-composite links, and allowlisted evidence fields
  must be defined before trust rows are written

## Phase 11B Planning Deliverables

- ADR-0002, Accepted and effective only when PR #14 is merged.
- Entity and aggregate inventory.
- Reconciled ownership map for existing tables.
- Identifier and idempotency strategy.
- Tenant and card isolation strategy.
- Authorization and command-specific permission strategy.
- Consent and suppression record requirements.
- Audit and trust-evidence linkage requirements.
- Migration and rollback strategy.
- Database-backed validation strategy.
- Implementation work-package map for a later authorized PR.

## Implementation Lock

Phase 11B implementation remains locked until PR #14 is merged, ADR-0002 or a
superseding ADR is Accepted and effective, every Phase Gate Policy entry
requirement is evidenced, and an owner-approved implementation package records
the authorized file scope. The authoritative implementation package order is in
`docs/phase-11/PHASE_11B_IMPLEMENTATION_PLAN.md`. This planning document must
not be used as migration or runtime implementation authority by itself.
