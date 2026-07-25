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

## Proposed Work Packages For Later Authorization

These are planning outputs only:

| Package | Purpose | Implementation status |
| --- | --- | --- |
| 11B-1 | Finalize ADR-0002 and entity inventory | Planning only |
| 11B-2 | Draft migration design and rollback plan | Locked |
| 11B-3 | Draft database-backed validation plan | Locked |
| 11B-4 | Draft repository/service integration plan | Locked |
| 11B-5 | Draft Phase 11B closure evidence template | Locked |

## Validation Strategy

Future implementation must include:

- migration verification;
- disposable PostgreSQL integration tests;
- tenant-isolation and cross-card negative tests;
- idempotency tests;
- append-only audit and lifecycle tests;
- consent and suppression tests;
- authorization tests;
- trust-evidence linkage tests;
- rollback validation;
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
