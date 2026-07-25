# Phase 11B Planning Package

Status: Draft planning
Date: 2026-07-25

## Scope

Phase 11B covers Communications Data Model planning only.

Permitted planning work:

- inventory existing communications-related storage;
- define entities, aggregates, identifiers, events, commands, state
  transitions, consent records, suppression records, audit records, trust
  evidence, routing data, receptionist-session data, and telephony adapter data
  boundaries;
- define tenant isolation, authorization, data classification, encryption,
  retention, privacy, indexing, concurrency, migration, rollback,
  observability, acceptance criteria, validation, and closure evidence;
- draft ADR-0002.

Prohibited work:

- migrations;
- schema changes;
- production code;
- generated clients;
- service implementation;
- deployment;
- provider integration;
- Phase 11C or later work;
- Phase 12 work;
- Wallet, payments expansion, cryptocurrency, digital assets, loyalty, rewards,
  or marketplace work.

## Phase 11A Closure Basis

Phase 11A is formally closed by:

- PR #13;
- merge commit `744d4ab9d5b04c69935848755d4b48d2e8f45c27`;
- effective Accepted ADR-0001;
- merged `docs/phase-11/PHASE_11A_CLOSURE_RECORD.md`;
- merged `docs/phase-11/PHASE_11A_TRACEABILITY.md`;
- post-merge `pnpm verify` on `main`;
- final Advisor disposition
  `ADVISOR_APPROVED_FOR_MERGE_AND_PHASE_11A_CLOSURE`.

## Existing Evidence Inventory

| Area | Evidence | Planning implication |
| --- | --- | --- |
| Telephony preparation | `database/migrations/0005_create_telephony_preparation.sql` | Earlier call, voice-session, and outbound-request tables must be reconciled as legacy preparation evidence. |
| Telephony domain foundation | `database/migrations/0016_create_telephony_domain_foundation.sql` | Existing tenant-scoped telephony tables should be reused or extended where compatible. |
| Trust persistence | `database/migrations/0017_create_cryptographic_trust_layer.sql` | Communications trust evidence should link to existing trust primitives without duplicating cryptographic storage. |
| Communications contracts | `packages/communications-domain/src` and `services/communications/src` | The data model must support existing command, event, policy, routing, participant, audit, and trust contracts. |
| Telephony adapter boundary | `services/telephony/src/communications-telephony-adapter-contract.ts` | Telephony remains transport metadata and adapter execution only. |
| Receptionist boundary | `services/polyglot-receptionist/src/communications-receptionist-boundary.ts` | Receptionist data cannot bypass Communications policy or provider dispatch rules. |

## Required Planning Decisions

- Which existing telephony tables are reused, extended, deprecated later, or
  left adapter-local.
- Which new Communications-owned tables are required.
- Which records are append-only.
- Which records require tenant/card composite constraints.
- Which records link to trust evidence.
- Which identifiers are product identifiers versus provider references.
- Which writes require idempotency keys.
- Which transitions require optimistic concurrency or append-only transition
  logs.
- Which data is prohibited from storage.

## Phase 11B Entry Requirements

Phase 11B implementation may begin only after all of the following are true:

- PR #14 is merged.
- ADR-0002 or a superseding Communications Data Model ADR is Accepted and
  effective.
- Scope and non-goals are explicit.
- Acceptance criteria are authoritative.
- The test and validation plan identifies required local and CI gates,
  including database-backed PostgreSQL validation.
- Rollback is defined as disabling new writers/readers or corrective
  roll-forward without deleting audit, consent, lifecycle, or trust evidence.
- Security, privacy, reliability, and observability requirements are defined.
- An owner-approved implementation plan records the exact file scope and work
  package order.
- No owner decision remains unresolved.
- Phase 11B scope is separable from Phase 11C orchestration behavior.
- Wallet, Phase 12, production activation, provider activation, and future work
  remain excluded.

## Security And Data Boundary Requirements

- Every reused, extended, deprecated, quarantined, adapter-local, or new table
  must have a table-by-table ownership decision.
- Legacy `0005_create_telephony_preparation.sql` writes must be quarantined or
  made safe before Communications-owned writes use them.
- Every tenant-owned relationship must use database-enforced
  tenant-composite references, plus card scope where applicable.
- Consent policy records must be separate from participant consent observations
  or receipts.
- Missing, expired, ambiguous, purpose-mismatched, channel-mismatched, stale, or
  revoked consent must deny dispatch.
- Raw webhook bodies and raw provider payload bytes are transient signature
  verification inputs by default.
- Durable webhook evidence may keep hashes, provider event IDs, verification
  results, timestamps, and sanitized metadata only, unless a later accepted
  implementation package documents legal basis, segregated encrypted storage,
  strict access control, short TTL, deletion evidence, and rollback behavior.
- Trust evidence must use exact Communications domains, artifact schemas,
  canonicalization versions, key purposes, tenant-composite links, and
  allowlisted fields.
- Actors must bind to authoritative user, service, or platform principal
  evidence, tenant memberships, card grants where applicable, sessions or
  delegated authority, authorization decision IDs, permission versions, policy
  versions, denial evidence, and audit events.
- Phase 11B must include a named mandatory PostgreSQL validation gate that
  applies the full migration chain and tests constraints, tenant isolation,
  immutability, concurrency, idempotency, rollback/roll-forward safety,
  dual-write prevention, provider credential absence, and disabled dispatch.

## Proposed Work Packages For Later Authorization

These are planning outputs only:

| Package | Purpose | Implementation status |
| --- | --- | --- |
| 11B-1 | Finalize ADR-0002, entity inventory, and table ownership decisions | Planning only |
| 11B-2 | Draft migration design, PostgreSQL validation gate, and rollback/roll-forward plan | Locked |
| 11B-3 | Draft tenant-isolation, authorization, consent, suppression, trust, PII, and raw-payload test plan | Locked |
| 11B-4 | Draft repository/service integration plan without Phase 11C orchestration behavior | Locked |
| 11B-5 | Draft Phase 11B traceability and closure evidence template | Locked |

## Validation Strategy

Future implementation must include:

- migration verification;
- disposable PostgreSQL integration tests;
- tenant-isolation and cross-card negative tests;
- tenant-composite foreign-key mismatch tests for every child/session/reference
  pair;
- idempotency tests;
- concurrency tests;
- append-only audit and lifecycle tests;
- consent and suppression tests;
- consent revocation-versus-dispatch race tests;
- authorization tests;
- forged actor, revoked session, revoked grant, cross-tenant principal, and
  kill-switch authorization denial tests;
- trust-evidence linkage tests;
- trust evidence allowlist and sensitive-field rejection tests;
- raw webhook body, raw provider payload, phone/email, authorization header,
  token, transcript, audio, and secret-like key rejection tests for audit,
  trust, logs, metrics, traces, and dashboard data;
- rollback or corrective roll-forward validation;
- repository `pnpm verify`;
- Advisor review.

## Closure Evidence Requirements

Phase 11B cannot close until:

- ADR-0002 or a superseding ADR is accepted;
- implementation work is explicitly authorized and completed;
- required migrations and rollback evidence exist;
- database-backed validation passes;
- security and authorization tests pass;
- documentation matches implementation;
- Advisor approval is recorded;
- a Phase 11B closure record is accepted and merged.
