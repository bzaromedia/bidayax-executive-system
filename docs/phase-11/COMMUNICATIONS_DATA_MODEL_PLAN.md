# Communications Data Model Plan

Status: Planning draft
Phase: 11B

## Principle

Phase 11 must extend the existing communications-related storage foundation rather than create a parallel overlapping domain.

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

- Extend `telephony_phone_numbers` for communications-owned number ownership metadata
- Extend `telephony_callback_requests` for communications callback orchestration
- Extend `telephony_call_sessions` for channel-neutral lifecycle linkage
- Extend `telephony_call_recordings` and `telephony_call_transcripts` for policy-owned metadata only
- Extend `telephony_consent_policies` for communications consent policy ownership
- Extend `telephony_audit_events` for communications audit coverage
- Add participants, state transitions, attempts, suppressions, business-hours policies, webhook evidence, summaries, provider health, and failover evidence

## Storage Rules

- all rows tenant-scoped
- composite card FKs where applicable
- immutable audit and lifecycle evidence
- durable idempotency keys
- no provider secrets in application tables
- no raw transcript or raw audio in trust evidence

## Phase 11B Planning Deliverables

- ADR-0002, Proposed during planning and Accepted only after review.
- Entity and aggregate inventory.
- Reuse, extend, or add decision table for existing tables.
- Identifier and idempotency strategy.
- Tenant and card isolation strategy.
- Authorization and command-specific permission strategy.
- Consent and suppression record requirements.
- Audit and trust-evidence linkage requirements.
- Migration and rollback strategy.
- Database-backed validation strategy.
- Implementation work-package map for a later authorized PR.

## Implementation Lock

Phase 11B implementation remains locked until ADR-0002 is accepted and an
implementation package is explicitly authorized. This planning document must
not be used as migration or runtime implementation authority.
