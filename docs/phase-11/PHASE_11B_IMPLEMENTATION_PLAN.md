# Phase 11B Implementation Plan

Status: Accepted when PR #14 is merged
Date: 2026-07-25

## Authorization Boundary

This plan becomes Phase 11B implementation authority only when all of these
conditions are true:

- PR #14 is merged.
- ADR-0002 is effective as Accepted in the merged repository history.
- The Phase 11B planning package and acceptance criteria are merged.
- Post-merge repository validation passes.
- Final Advisor disposition is
  `ADVISOR_APPROVED_FOR_MERGE_AND_PHASE_11B_ENTRY`.
- The current owner instruction authorizes Phase 11B implementation only after
  those gates pass.

No Phase 11B implementation may begin from an unmerged planning branch.

## Owner-Approved Scope

The owner-approved implementation scope is limited to the Communications Data
Model. It may define data contracts, persistence schema, repository interfaces,
validation scripts, tests, and traceability evidence required by ADR-0002.

The plan does not authorize:

- Phase 11C orchestration runtime behavior;
- provider activation;
- live webhooks;
- live inbound calls;
- live outbound calls;
- production deployment;
- production database access;
- VPS access;
- Phase 12 work;
- Wallet, payments expansion, cryptocurrency, digital assets, loyalty, rewards,
  marketplace, white-label, enterprise, or Version 2 work.

## Technology Inventory

| Technology | Repository-approved role | Phase 11B use | Change policy |
| --- | --- | --- | --- |
| Node.js 22 | Repository runtime target | Run scripts, tests, and workspace tools | No runtime upgrade. |
| `pnpm@11.7.0` | Package manager | Workspace validation and scripts | No package-manager change. |
| TypeScript | Domain and service contracts | Define data-model and repository types | No broad compiler change. |
| PostgreSQL | Durable structured store | Communications data-model migration and integration validation | Use existing migration directory. |
| `pg` | Existing PostgreSQL client dependency | Disposable PostgreSQL validation script if needed | No new database client. |
| Vitest | Existing unit/integration test runner | Domain and service tests | No test framework change. |
| GitHub Actions CI | Required remote verification | Existing `verify` workflow plus any added repository-local script | No CI bypass. |

No new dependency is approved by this plan. Any dependency request must be
documented as a separate owner decision before use.

## Authorized File Scope

Implementation may modify only these existing files when directly required by
ADR-0002:

- `package.json`
- `packages/communications-domain/src/index.ts`
- `packages/communications-domain/src/audit/index.ts`
- `packages/communications-domain/src/commands/index.ts`
- `packages/communications-domain/src/consent/index.ts`
- `packages/communications-domain/src/events/index.ts`
- `packages/communications-domain/src/participants/index.ts`
- `packages/communications-domain/src/policies/index.ts`
- `packages/communications-domain/src/routing/index.ts`
- `packages/communications-domain/src/state-machines/index.ts`
- `packages/communications-domain/src/suppressions/index.ts`
- `packages/communications-domain/src/trust/index.ts`
- `packages/communications-domain/src/types/index.ts`
- `services/communications/src/repositories/index.ts`
- `services/communications/src/index.ts`
- `docs/phase-11/COMMUNICATIONS_DATA_MODEL_PLAN.md`
- `docs/phase-11/GAP_ANALYSIS.md`
- `docs/phase-11/PHASE_11B_ACCEPTANCE_CRITERIA.md`

Implementation may add only these new files:

- `database/migrations/0018_create_communications_data_model.sql`
- `packages/communications-domain/src/data-model/index.ts`
- `packages/communications-domain/tests/data-model.test.ts`
- `services/communications/tests/data-model-repository-contract.test.ts`
- `scripts/verify-communications-data-model-postgres.ts`
- `docs/phase-11/PHASE_11B_TRACEABILITY.md`

No service runtime, adapter execution, provider, dashboard UI, receptionist
runtime, deployment, or generated-client files are in scope.

## Work Package Order

| Package | Scope | Exit evidence |
| --- | --- | --- |
| 11B-1 | Add communications data-model domain contracts and table ownership mapping. | Type tests and data-model unit tests pass. |
| 11B-2 | Add forward-only migration `0018_create_communications_data_model.sql`. | Migration verifier passes; no existing migration is edited. |
| 11B-3 | Add repository interfaces without runtime orchestration behavior. | Service repository contract tests pass. |
| 11B-4 | Add named PostgreSQL validation script and package script. | Disposable PostgreSQL validation passes or reports a documented blocker. |
| 11B-5 | Add Phase 11B traceability evidence. | Requirements map to files, tests, commands, and residual risks. |

Work packages must run in order. Later packages may not compensate for an
unresolved earlier package.

## Table Ownership Decisions

| Existing area | Decision |
| --- | --- |
| `0005_create_telephony_preparation.sql` | Quarantine as legacy preparation evidence. Do not write Communications-owned rows to these tables. |
| `telephony_phone_numbers` | Adapter-local number metadata; may be referenced by Communications through tenant-composite constraints only. |
| `telephony_call_sessions` | Adapter-local transport sessions; Communications lifecycle must use its own aggregate and may link by tenant-composite adapter reference. |
| `telephony_callback_requests` | Legacy callback evidence; no new Communications ownership until a later cutover plan proves compatibility. |
| `telephony_call_transcripts` | Adapter-local metadata only; raw transcript storage remains prohibited for Communications trust evidence. |
| `telephony_call_recordings` | Adapter-local metadata only; raw audio storage remains prohibited for Communications trust evidence. |
| `telephony_consent_policies` | Legacy policy evidence; Phase 11B must separate Communications consent policies from participant consent receipts. |
| `telephony_audit_events` | Adapter-local audit evidence; Communications must create its own audit boundary or tenant-composite safe references. |
| `trust_*` and `cryptographic_envelopes` | Trust-owned immutable evidence; Communications may link only through explicit domains, artifact schemas, and allowlisted sanitized fields. |
| `tenant_memberships`, `card_access_grants`, `application_sessions` | Identity-owned authorization evidence; Communications actor records must reference authoritative identity/session/grant context. |

## Required Data Structures

The implementation must define or prove unnecessary:

- communication aggregate root;
- participant records;
- participant endpoints;
- consent policies;
- participant consent receipts;
- suppression records;
- lifecycle transition records;
- command idempotency records;
- dispatch attempt records without provider execution;
- webhook evidence records with sanitized metadata only;
- routing policy records;
- receptionist-session references;
- adapter health references;
- trust evidence references;
- append-only audit events.

## Validation Matrix

| Gate | Required command or evidence |
| --- | --- |
| Formatting | `git diff --check` |
| Domain types | `pnpm --filter @bidayax/communications-domain typecheck` |
| Domain tests | `pnpm --filter @bidayax/communications-domain test` |
| Service types | `pnpm --filter @bidayax/communications typecheck` |
| Service tests | `pnpm --filter @bidayax/communications test` |
| Migration sequence | `pnpm db:migrations:verify` |
| PostgreSQL data-model gate | `pnpm verify:communications-data-model:postgres` |
| Public claims | `pnpm verify:public-claims` |
| Placeholder scan | `pnpm verify:no-placeholders` |
| Release scope | `pnpm verify:release-scope` |
| Workspace integrity | `pnpm verify:no-missing-workspaces` |
| Full repository gate | `pnpm verify` |
| Secret scan | PR diff secret-pattern scan |
| Advisor review | `ADVISOR_APPROVED` before implementation commit |

## Required Test Evidence

The implementation must test:

- tenant-composite relationship rejection;
- cross-card rejection;
- forged actor rejection;
- revoked session or grant rejection;
- missing, stale, mismatched, ambiguous, and revoked consent denial;
- consent revocation versus dispatch race behavior;
- suppression enforcement at the data boundary;
- idempotency retry behavior;
- optimistic concurrency or append-only transition behavior;
- audit immutability;
- trust evidence allowlist rejection for sensitive fields;
- raw webhook body and provider payload exclusion from durable records;
- phone, email, authorization header, token, transcript, audio, and secret-like
  key rejection from audit, trust, logs, metrics, traces, and dashboard-facing
  records;
- rollback or corrective roll-forward safety;
- provider credential absence;
- dispatch disabled until Phase 11I.

## Entry Gate Evidence

This implementation plan satisfies these Phase Gate Policy entry requirements
when PR #14 is merged:

- accepted ADR coverage: ADR-0002;
- scope and non-goals: this plan and ADR-0002;
- acceptance criteria: `docs/phase-11/PHASE_11B_ACCEPTANCE_CRITERIA.md`;
- test and validation plan: this plan;
- rollback strategy: ADR-0002 and this plan;
- security, privacy, reliability, and observability requirements: ADR-0002;
- owner-approved implementation plan: this document after PR #14 merge under
  the current explicit owner instruction.

No owner decision remains unresolved for repository-local Phase 11B
implementation. Production authorization, provider activation, legal approval,
and Phase 11C+ decisions remain locked future gates.
