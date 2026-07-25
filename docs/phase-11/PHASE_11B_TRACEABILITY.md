# Phase 11B Traceability

Status: Implementation branch evidence, not formal closure
Date: 2026-07-25

Phase 11B is the Communications Data Model subphase. This document maps
ADR-0002 and the Phase 11B acceptance criteria to implementation and validation
evidence. It does not close Phase 11B by itself.

## Evidence Summary

| Requirement | Implementation evidence | Test or validation evidence | Disposition |
| --- | --- | --- | --- |
| Communications-owned aggregate and entity model | `database/migrations/0018_create_communications_data_model.sql`; `packages/communications-domain/src/data-model/index.ts` | `pnpm --filter @bidayax/communications-domain test`; `pnpm verify:communications-data-model:postgres` | Addressed for Draft PR review |
| Table-by-table ownership decisions | `docs/phase-11/COMMUNICATIONS_OWNERSHIP_MAP.md`; `docs/phase-11/COMMUNICATIONS_DATA_MODEL_PLAN.md` | Advisor review required before commit | Addressed for Draft PR review |
| Legacy telephony quarantine | `docs/phase-11/COMMUNICATIONS_OWNERSHIP_MAP.md`; migration `0018` creates Communications-owned tables instead of writing legacy telephony tables | PostgreSQL verifier applies full migration chain and does not use legacy telephony writes as Communications records | Addressed for Draft PR review |
| Tenant and card isolation | Composite tenant/card constraints in migration `0018` | PostgreSQL verifier rejects cross-card and cross-tenant endpoint, lifecycle, and reference writes | Addressed for Draft PR review |
| Single-writer ownership and dual-write prevention | Communications-owned tables in migration `0018`; telephony tables remain adapter-local in ownership map | Diff inspection; ownership documentation | Addressed for Draft PR review |
| Product identifiers separated from provider references | `communications.communication_id` is product-owned; adapter and provider references are separate fields | Domain tests and PostgreSQL verifier | Addressed for Draft PR review |
| Durable idempotency and retries | `communication_command_idempotency_keys`; repository contract `reserveCommandIdempotency` | Domain tests; PostgreSQL duplicate-key rejection | Addressed for Draft PR review |
| Canonical lifecycle transitions | `communication_lifecycle_transitions`; transition trigger in migration `0018` | PostgreSQL verifier checks valid transition, invalid transition, terminal re-entry rejection, and append-only behavior | Addressed for Draft PR review |
| Consent policy and receipt separation | `communication_consent_policies`; `communication_consent_receipts` | PostgreSQL verifier checks active, missing, expired, revoked, and ambiguous consent dispatch outcomes | Addressed for Draft PR review |
| Suppression enforcement | `communication_suppressions`; dispatch policy trigger | PostgreSQL verifier checks active suppression denial | Addressed for Draft PR review |
| Audit immutability and denied-action evidence | `communication_audit_events`; append-only trigger; user-actor check | PostgreSQL verifier checks append-only mutation rejection and actor requirement | Addressed for Draft PR review |
| Trust evidence sanitized links | `communication_trust_evidence_references`; allowlisted trust evidence fields | Domain tests; PostgreSQL sensitive-field rejection | Addressed for Draft PR review |
| Raw payload, PII, transcript, audio, token, and secret exclusion | `communication_metadata_is_safe_v1`; durable payload retention disabled | Domain metadata tests; PostgreSQL webhook, audit, and trust negative tests | Addressed for Draft PR review |
| Authorization evidence | Command idempotency references membership, session, grant, authorization decision, permission version, and policy version | PostgreSQL verifier rejects forged actor, revoked session, and revoked grant evidence | Addressed for Draft PR review |
| Retention and deletion requirements | Retention classes on aggregate, consent policy, and data structures | Migration checks; documentation updates | Addressed for Draft PR review |
| Rollback or corrective roll-forward safety | Forward-only migration `0018`; rollback is disabling new writers/readers or corrective roll-forward without deleting evidence | PostgreSQL verifier applies the full migration chain inside a transaction and rolls back test data | Addressed for Draft PR review |
| Named PostgreSQL validation gate | `scripts/verify-communications-data-model-postgres.ts`; `package.json` script | `pnpm verify:communications-data-model:postgres` | Passed locally on implementation branch |
| Repository validation | Workspace scripts and repository gates | `pnpm install --frozen-lockfile`; `pnpm verify`; `pnpm verify:production`; policy verifiers; `git diff --check`; secret-pattern scan | Passed locally on implementation branch |
| Advisor approval | Independent read-only Advisor review | Required disposition: `ADVISOR_APPROVED` | Pending final gate |

## Remaining Risks

- Phase 11B implementation must still be reviewed and merged before any
  closure record can be authoritative.
- Runtime orchestration, provider activation, receptionist runtime execution,
  observability operations, staging validation, and production activation remain
  locked to later Phase 11 subphases.
- Live legal, retention, and jurisdictional policy review remains required
  before production communication execution.

## Deferred Work

- Phase 11C: Orchestration runtime.
- Phase 11D: Telephony adapter implementation.
- Phase 11E: Polyglot Receptionist runtime.
- Phase 11F: Security, consent, and trust runtime controls beyond the data
  boundary.
- Phase 11G: Observability and operations.
- Phase 11H: Staging validation.
- Phase 11I: Production activation.

Phase 12, Wallet, payments expansion, cryptocurrency, digital assets, loyalty,
rewards, marketplace, white-label, enterprise expansion, and Version 2 remain
locked.

## Advisor Finding Remediation

Fallback Advisor review on 2026-07-25 returned `ADVISOR_REJECTED` before
commit because three Phase 11B data-boundary findings remained:

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Trust evidence allowlist was declared but not enforced. | HIGH | `packages/communications-domain/src/data-model/index.ts`; `database/migrations/0018_create_communications_data_model.sql` | Domain test rejects `safeButUnexpected`; PostgreSQL verifier rejects non-allowlisted trust evidence keys. |
| Nullable child/reference `card_id` values could bypass card-scoped composite FKs under PostgreSQL `MATCH SIMPLE`. | HIGH | Null-safe participant and communication card-scope triggers in migration `0018` | PostgreSQL verifier rejects null-card bypass attempts across endpoint, consent, suppression, lifecycle, dispatch, webhook, receptionist-session, trust-reference, and audit rows. |
| Receptionist-session legacy reference used a bare FK to `receptionist_interactions(id)` without tenant/card scope. | HIGH | Migration `0018` removes the hard FK and documents the legacy UUID as a non-authoritative sanitized reference until a later tenant/card-safe receptionist cutover. | PostgreSQL verifier validates receptionist-session card scope through the Communications aggregate and rejects null-card bypass. |

These remediations address the blocking findings for Draft PR readiness. A
final read-only Advisor approval remains required before commit.

Second fallback Advisor review on 2026-07-25 returned `ADVISOR_REJECTED`
because consent receipts could cite a same-tenant but wrong-card or
wrong-channel/purpose policy.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Consent receipt to consent policy compatibility was tenant-bound but not card/channel/purpose-bound. | HIGH | `database/migrations/0018_create_communications_data_model.sql` adds `enforce_communication_consent_policy_scope_v1`. | PostgreSQL verifier rejects cross-card policy citation and channel/purpose-mismatched policy citation. |

Third fallback Advisor review on 2026-07-25 returned `ADVISOR_REJECTED`
because dispatch-attempt policy checks applied only on insert, allowing a
blocked or failed row to be updated into queued state without rechecking
consent and suppression rules.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Dispatch consent and suppression denial could be bypassed through update. | HIGH | `database/migrations/0018_create_communications_data_model.sql` runs `trg_communication_dispatch_policy` `BEFORE INSERT OR UPDATE`. | PostgreSQL verifier rejects updates from blocked dispatch attempts into queued state with missing consent and with active suppression. |
