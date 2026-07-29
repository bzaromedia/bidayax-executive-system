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
| Durable idempotency and retries | `communication_command_idempotency_keys`; repository contracts `reserveCommandIdempotency` and `completeCommandIdempotency` | Domain tests; PostgreSQL duplicate-key rejection, terminal-insert rejection, immutable authorization fields, and controlled reserved-to-terminal result update | Addressed for Draft PR review |
| Canonical lifecycle transitions | `communication_lifecycle_transitions`; transition trigger in migration `0018` | PostgreSQL verifier checks valid transition, invalid transition, terminal re-entry rejection, backdated-transition rejection, forged aggregate update rejection, and append-only behavior | Addressed for Draft PR review |
| Consent policy and receipt separation | `communication_consent_policies`; `communication_consent_receipts`; consent trust-evidence FK and trigger | PostgreSQL verifier checks active, missing, nonexistent, mismatched, omitted-timing, mismatched-timing, expired, revoked, invalid-chronology, and ambiguous consent evidence and dispatch outcomes | Addressed for Draft PR review |
| Suppression enforcement | `communication_suppressions`; dispatch policy trigger; controlled release trigger | PostgreSQL verifier checks active suppression denial, missing release-audit rejection, controlled active-to-released transition, double-release rejection, and post-release dispatch eligibility | Addressed for Draft PR review |
| Audit immutability and denied-action evidence | `communication_audit_events`; append-only trigger; user/service/platform actor checks | PostgreSQL verifier checks append-only mutation rejection and invalid user/service actor rejection | Addressed for Draft PR review |
| Trust evidence sanitized links | `communication_trust_evidence_references`; allowlisted trust evidence fields; envelope-required payload projection; Communications Trust runtime domains in `packages/trust/src/domains.ts` | Domain tests; Trust package tests; PostgreSQL sensitive-field, non-allowlisted-field, missing-envelope, wrong-key-purpose, payload-mismatch, and event/domain mismatch rejection | Addressed for Draft PR review |
| Raw payload, PII, transcript, audio, token, and secret exclusion | `communication_metadata_is_safe_v1`; durable payload retention disabled | Domain metadata tests; PostgreSQL webhook, audit, and trust negative tests | Addressed for Draft PR review |
| Authorization evidence | Command idempotency references membership, session, grant, durable authorization-decision audit evidence, permission version, and policy version; service/platform commands require active Trust identities and explicit capabilities | PostgreSQL verifier rejects forged actor, viewer tenant-kill-switch, unprivileged service/platform, disabled service, cross-tenant service, revoked session, and revoked grant evidence | Addressed for Draft PR review |
| Retention and deletion requirements | Retention classes on aggregate, consent policy, and data structures | Migration checks; documentation updates | Addressed for Draft PR review |
| Rollback or corrective roll-forward safety | Forward-only migration `0018`; rollback is disabling new writers/readers or corrective roll-forward without deleting evidence | PostgreSQL verifier applies the full migration chain to a disposable/test schema and rolls back verification fixture data | Addressed for Draft PR review |
| Named PostgreSQL validation gate | `scripts/verify-communications-data-model-postgres.ts`; `package.json` script; `.github/workflows/ci.yml` required step | `pnpm verify:communications-data-model:postgres` | Passed twice locally on remediated working tree; remote CI pending after push |
| Production Readiness Review | `docs/phase-11/PHASE_11B_PRODUCTION_READINESS_REVIEW.md` | Required final disposition: `PRODUCTION_READINESS_REVIEW_PASSED` before PR #15 merge | Passed locally after latest Advisor remediation; remote CI and Advisor merge gates remain pending |
| Repository validation | Workspace scripts and repository gates | `pnpm install --frozen-lockfile`; `pnpm verify`; `pnpm verify:production`; policy verifiers; `git diff --check`; secret-pattern scan | Passed locally on remediated working tree; remote CI pending after push |
| Advisor approval | Independent read-only Advisor review | Required disposition: `ADVISOR_APPROVED_FOR_MERGE` after final local validation and final-head CI | Pending final gate |

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

Latest fallback Advisor review on 2026-07-25 returned `ADVISOR_REJECTED`
because several Critical and High merge-readiness defects remained after the
earlier remediation.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Dispatch policy locks were exact-only while consent and suppression policy subjects can be wildcarded, and the verifier accepted any second-connection error as contention. | CRITICAL | `lock_communication_policy_subject_hierarchy_v1` locks exact and wildcard policy subjects; `scripts/verify-communications-data-model-postgres.ts` asserts SQLSTATE `57014` from a committed-schema second connection. | `pnpm verify:communications-data-model:postgres` |
| Command authorization was not proven against active tenant-bound service/platform identities and command-specific card grant permissions. | CRITICAL | Migration `0018` requires active Trust identities for service/platform actors, exact operation registration, and required permission membership in `card_access_grants.permission_set`. | PostgreSQL verifier exercises user, service, platform, forged actor, cross-tenant service, revoked session, and revoked grant cases. |
| Command and dispatch contracts allowed unregistered operation drift, cardless dispatch references, and no controlled idempotency result update. | CRITICAL | Migration `0018` checks the exact Phase 11B command operation set, requires non-null dispatch card scope, and permits only immutable request evidence plus reserved-to-terminal result updates. | PostgreSQL verifier persists every card-scoped operation, rejects duplicate requests, and rejects completed command reopening or authorization mutation. |
| Trust domains were not registered in the Trust runtime and trust references could omit durable Trust links. | CRITICAL | `packages/trust/src/domains.ts` and Trust tests register Communications domains; migration `0018` requires compatible envelope or trust-event linkage. | `pnpm --filter @bidayax/trust test`; PostgreSQL missing-link and mismatch tests. |
| Communication aggregate lifecycle state was forgeable through a caller-set session setting. | CRITICAL | Migration `0018` only allows aggregate state/version changes during lifecycle trigger execution and keeps direct updates blocked even after caller-set settings. | PostgreSQL verifier rejects direct update and forged-setting update. |
| Raw phone-number detection missed bare and formatted phone values. | HIGH | SQL and TypeScript metadata guards reject `+15555550123`, `15555550123`, and `(555) 555-0123`-style patterns. | Domain metadata tests and PostgreSQL unsafe metadata tests. |
| Suppression release integrity lacked authoritative release actor, reason, audit linkage, and immutable scope. | HIGH | Migration `0018` binds suppression actors to tenant memberships, requires release actor/reason/audit event for the only permitted active-to-released transition, rejects direct released inserts, preserves immutable scope, and rejects deletes or double releases. | PostgreSQL active suppression, controlled release, missing-release-audit, post-release dispatch, dispatch denial, and mutation rejection tests. |
| Receptionist interaction references could cite arbitrary UUIDs without tenant/card ownership. | HIGH | Migration `0018` rejects non-null legacy receptionist interaction UUIDs until a later Phase 11E cutover defines authoritative ownership. | PostgreSQL non-null receptionist interaction reference rejection. |
| PRR and traceability evidence overstated final coverage before final remediated-head CI and Advisor approval. | HIGH | This document and the PRR now preserve local remediation evidence while marking final Advisor and CI gates as pending until they run on the final PR head. | Final CI and Advisor review remain required before merge. |

Final pre-commit Advisor review on 2026-07-26 returned `ADVISOR_REJECTED`
because additional Critical and High data-boundary evidence gaps remained.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Consent `evidence_reference_id` was unbound text and dispatch only checked non-null evidence. | CRITICAL | Migration `0018` binds consent receipts to Communications trust references with matching consent domain, artifact schema, card, receipt ID, channel, and policy version. | PostgreSQL missing, nonexistent, and wrong-receipt consent evidence tests. |
| Tenant/platform kill-switch authorization accepted weak service/platform identities and unbound authorization decisions. | CRITICAL | Migration `0018` requires owner/admin tenant kill-switch user role, active Trust service/platform identities with explicit kill-switch capabilities, and durable authorization-decision audit rows. | PostgreSQL viewer, unprivileged service/platform, disabled service, cross-tenant service, forged actor, and durable decision tests. |
| Command/idempotency contracts allowed direct terminal inserts and lacked a controlled result contract. | CRITICAL | Migration `0018` rejects terminal command inserts and allows only immutable reserved-to-terminal result updates; repository interface adds `completeCommandIdempotency`. | Domain/service contract tests and PostgreSQL terminal-insert, result-update, and reopen rejection tests. |
| Trust linkage allowed event-only references, overly broad key purposes, and unsigned evidence projections. | CRITICAL | Migration `0018` requires compatible cryptographic envelopes, limits key purpose to tenant artifact signing, and requires evidence fields to equal signed envelope payload. | PostgreSQL missing-envelope, wrong-key-purpose, payload-mismatch, event-mismatch, and domain/schema mismatch tests. |
| Suppression release integrity could not prove a controlled one-way release. | HIGH | Migration `0018` rejects direct released inserts, requires authorized release actor, release reason, matching release audit event, immutable scope, and one active-to-released transition. | PostgreSQL missing-release-audit, active suppression denial, controlled release, post-release dispatch, double-release, and delete rejection tests. |
| Audit and summary actor evidence could cite weak or unbound actor IDs. | HIGH | Migration `0018` binds audit and summary user/service/platform actors to active tenant memberships or Trust identities. | PostgreSQL missing-user actor, disabled-service audit actor, and forged-summary actor tests. |
| Adapter health reason codes could carry sensitive values. | HIGH | Migration `0018` applies `communication_metadata_is_safe_v1` to adapter-health reason-code arrays. | PostgreSQL adapter-health sensitive reason-code rejection test. |
| Negative PostgreSQL tests accepted any database error. | HIGH | `scripts/verify-communications-data-model-postgres.ts` now requires every negative case to match a declared expected failure pattern. | `pnpm verify:communications-data-model:postgres`. |
| Phone detection rejected ISO dates. | MEDIUM | SQL and TypeScript phone detectors were narrowed while retaining explicit phone-pattern rejection. | Domain safe metadata positive ISO-date test plus phone-pattern rejection tests. |
| Lifecycle timestamps could be backdated against aggregate state. | MEDIUM | Migration `0018` rejects lifecycle transitions older than the current aggregate `updated_at`. | PostgreSQL backdated-transition rejection test. |

Final merge-gate Advisor and read-only sidecar reviews on 2026-07-26 and
2026-07-27 returned `REJECTED` because additional executable evidence and
fail-closed database controls were still missing.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Tenant users could reserve platform kill-switch commands and authorization decisions were not operation/scope/request bound. | CRITICAL | Migration `0018` enforces an operation/scope/actor matrix and exact authorization-decision metadata for operation, scope, permission, request hash, session, and grant. | PostgreSQL user platform-kill-switch, cross-operation decision reuse, and forged version tests. |
| Consent evidence did not prove cited policy version, active envelope/key state, Trust event binding, or verification receipt validity. | CRITICAL | Migration `0018` requires signed consent projection fields, active unexpired envelopes, active uncompromised keys, Trust event envelope binding, and valid `trust_verification_receipts`. | PostgreSQL wrong policy version, null Trust event, invalid verification receipt, revoked envelope, and Trust event mismatch tests. |
| Lifecycle transitions cited unconstrained authorization text. | CRITICAL | Migration `0018` requires resource-matched authorization-decision audit evidence for every lifecycle transition. | PostgreSQL missing and wrong-operation lifecycle authorization tests. |
| Command result and replay semantics were contradictory. | CRITICAL | Migration `0018` and domain contracts limit persisted status to `completed` or `failed`, keep replay as a repository return outcome, and enforce operation-specific result communication IDs. | Domain result tests; PostgreSQL missing result, failed-with-result, persisted replay, and reserved-with-result tests. |
| Suppression release audit evidence was reusable and weakly resource-bound. | HIGH | Migration `0018` makes release audit evidence one-use and binds suppression ID, release reason, permission, decision ID, actor, card, and chronology. | PostgreSQL audit-reuse and wrong-reason suppression release tests. |
| Audit and summary user evidence lacked card-scoped session/grant/permission proof. | HIGH | Migration `0018` requires user audit/summary inserts to cite active sessions, active card grants, and required permissions; service/platform actors require writer capabilities. | PostgreSQL audit sensitive metadata, missing actor, disabled service, and summary missing-grant tests. |
| Adapter-health reason codes accepted structurally unsafe arrays. | HIGH | Migration `0018` adds bounded uppercase string-code validation through `communication_reason_codes_are_safe_v1`. | PostgreSQL non-string, nested, prose, oversized, and phone-like reason-code tests. |
| The named PostgreSQL verifier was absent from CI and could leak disposable containers. | HIGH | `package.json` root `verify` and `.github/workflows/ci.yml` now run `pnpm verify:communications-data-model:postgres`; the verifier now routes completion through cleanup-safe finalization. | PostgreSQL gate passed twice locally after cleanup refactor; remote CI pending after push. |
| PRR and traceability overclaimed passing final evidence while the merge gate was still rejected. | HIGH | PRR was reopened during remediation, then promoted to `PRODUCTION_READINESS_REVIEW_PASSED` only after local full validation passed; traceability separates local evidence from final remote CI and Advisor gates. | Local full validation passed; remote CI and Advisor review remain required before merge. |

Final merge-gate Advisor review on 2026-07-28 returned `REJECTED`
because additional consent timing and TypeScript contract-parity findings
remained.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Consent Trust evidence omitted exact signed observed, effective, expiry, and revocation timing. | CRITICAL | Migration `0018` requires signed temporal evidence fields to match receipt timestamps exactly, requires explicit JSON null expiry/revocation where absent, and rejects invalid receipt chronology. | PostgreSQL omitted/mismatched observed/effective/expiry/revocation and invalid-chronology tests passed via `pnpm verify:communications-data-model:postgres` and `pnpm verify`. |
| TypeScript command authorization accepted database-invalid versions, scopes, actors, and permissions. | HIGH | Domain contract exports literal Phase 11B permission and policy versions and enforces the SQL operation/scope/actor/permission matrix. | Domain operation-matrix positive and negative tests passed via `pnpm --filter @bidayax/communications-domain test` and `pnpm verify`. |
| TypeScript Trust-reference contract rejected valid consent fields and accepted null Trust event linkage. | HIGH | Domain trust allowlist includes consent projection fields, requires non-empty Trust event IDs, and rejects domain/schema mismatches. | Domain consent-projection positive and missing-link/domain mismatch tests passed via `pnpm --filter @bidayax/communications-domain test` and `pnpm verify`. |
| CI workflow validation change lacked explicit file-scope coverage. | HIGH | Implementation plan now includes `.github/workflows/ci.yml` as PRR evidence-scope validation work. | `git diff --name-only origin/main` confirms the workflow file is in the amended scope. |
| Remote CI covered only prior PR head. | HIGH | Final remediated tree must be committed and pushed only after local validation and fresh Advisor approval. | GitHub CI pending after push on final SHA. |
