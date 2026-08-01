# Phase 11B Traceability

Status: Implementation merged; post-merge correctness remediation active; not formal closure
Date (America/Los_Angeles): 2026-07-28

Phase 11B is the Communications Data Model subphase. This document maps
ADR-0002 and the Phase 11B acceptance criteria to implementation and validation
evidence. It does not close Phase 11B by itself.

## Evidence Summary

| Requirement | Implementation evidence | Test or validation evidence | Disposition |
| --- | --- | --- | --- |
| Communications-owned aggregate and entity model | `database/migrations/0018_create_communications_data_model.sql`; `database/migrations/0019_harden_communications_data_model_guards.sql`; `packages/communications-domain/src/data-model/index.ts` | `pnpm --filter @bidayax/communications-domain test`; `pnpm verify:communications-data-model:postgres` | Implementation merged by PR #15; post-merge guard remediation active |
| Table-by-table ownership decisions | `docs/phase-11/COMMUNICATIONS_OWNERSHIP_MAP.md`; `docs/phase-11/COMMUNICATIONS_DATA_MODEL_PLAN.md` | Advisor review required before commit | Addressed for Draft PR review |
| Legacy telephony quarantine | `docs/phase-11/COMMUNICATIONS_OWNERSHIP_MAP.md`; migration `0018` creates Communications-owned tables instead of writing legacy telephony tables | PostgreSQL verifier applies full migration chain and does not use legacy telephony writes as Communications records | Addressed for Draft PR review |
| Tenant and card isolation | Composite tenant/card constraints in migration `0018`; post-merge fail-closed guards in migration `0019` | PostgreSQL verifier rejects cross-card and cross-tenant endpoint, lifecycle, and reference writes | Implementation merged by PR #15; post-merge guard remediation active |
| Single-writer ownership and dual-write prevention | Communications-owned tables in migration `0018`; telephony tables remain adapter-local in ownership map | Diff inspection; ownership documentation | Addressed for Draft PR review |
| Product identifiers separated from provider references | `communications.communication_id` is product-owned; adapter and provider references are separate fields | Domain tests and PostgreSQL verifier | Addressed for Draft PR review |
| Durable idempotency and retries | `communication_command_idempotency_keys`; repository contracts `reserveCommandIdempotency` and `completeCommandIdempotency`; migration `0019` database-owned command creation timestamp and evidence-preserving pre-0019 command invalidation gate | Domain tests; PostgreSQL duplicate-key rejection, terminal-insert rejection, immutable authorization fields, backdated expired session/grant rejection, controlled reserved-to-terminal result update, and 0018-to-0019 legacy command invalidation requiring a new command key and fresh authorization | Implementation merged by PR #15; post-merge guard remediation active |
| Canonical lifecycle transitions | `communication_lifecycle_transitions`; transition trigger in migration `0018` | PostgreSQL verifier checks valid transition, invalid transition, terminal re-entry rejection, backdated-transition rejection, forged aggregate update rejection, and append-only behavior | Addressed for Draft PR review |
| Consent policy and receipt separation | `communication_consent_policies`; `communication_consent_receipts`; consent trust-evidence FK and migration `0019` required-key/null-safe trigger guards | PostgreSQL verifier checks active, missing, nonexistent, mismatched, omitted-identity, omitted-timing, mismatched-timing, expired, revoked, invalid-chronology, and ambiguous consent evidence and dispatch outcomes | Implementation merged by PR #15; post-merge guard remediation active |
| Suppression enforcement | `communication_suppressions`; dispatch policy trigger; controlled release trigger | PostgreSQL verifier checks active suppression denial, missing release-audit rejection, controlled active-to-released transition, double-release rejection, and post-release dispatch eligibility | Addressed for Draft PR review |
| Audit immutability and denied-action evidence | `communication_audit_events`; append-only trigger; user/service/platform actor checks | PostgreSQL verifier checks append-only mutation rejection and invalid user/service actor rejection | Addressed for Draft PR review |
| Trust evidence sanitized links | `communication_trust_evidence_references`; allowlisted trust evidence fields; envelope-required payload projection; migration `0019` Trust event envelope binding and legacy-row revalidation; Communications Trust runtime domains in `packages/trust/src/domains.ts` | Domain tests; Trust package tests; PostgreSQL sensitive-field, non-allowlisted-field, missing-envelope, missing Trust event envelope link, wrong-key-purpose, payload-mismatch, event/domain mismatch rejection, and 0018-to-0019 missing-envelope-link rejection | Implementation merged by PR #15; post-merge guard remediation active |
| Raw payload, PII, transcript, audio, token, and secret exclusion | `communication_metadata_is_safe_v1`; TypeScript `assertSafeCommunicationMetadata`; durable payload retention disabled | Domain metadata tests reject sensitive values, nested runtime metadata, malformed hash-designated metadata fields, and non-string hash primitives; PostgreSQL webhook, audit, hash-field, and trust negative tests cover null, number, boolean, object, array, empty, malformed, and uppercase values at the durable metadata boundary | Implementation merged by PR #15; post-merge guard remediation active |
| Authorization evidence | Command idempotency references membership, session, grant, durable authorization-decision audit evidence, permission version, and policy version; migration `0019` requires explicit authorization-decision metadata keys with null-safe comparisons; service/platform commands require active Trust identities and explicit capabilities | PostgreSQL verifier rejects forged actor, viewer tenant-kill-switch, unprivileged service/platform, disabled service, cross-tenant service, revoked session/grant, backdated expired session/grant, and missing authorization metadata evidence | Implementation merged by PR #15; post-merge guard remediation active |
| Retention and deletion requirements | Retention classes on aggregate, consent policy, and data structures | Migration checks; documentation updates | Addressed for Draft PR review |
| Rollback or corrective roll-forward safety | Forward-only migrations `0018` and `0019`; rollback is disabling new writers/readers or corrective roll-forward without deleting evidence; legacy command rows are terminally invalidated instead of silently upgraded and retries require a new command key with fresh authorization | PostgreSQL verifier applies migrations through `0018`, seeds representative valid and invalid 0018-era metadata, consent, Trust, and command evidence, applies `0019`, verifies valid metadata and consent rows survive, verifies legacy commands are preserved as failed reauthorization-required evidence, verifies invalid legacy rows fail closed, verifies constraints are validated, applies the full migration chain to the exact local disposable database name, and rolls back verification fixture data | Post-merge corrective roll-forward active |
| Named PostgreSQL validation gate | `scripts/verify-communications-data-model-postgres.ts`; `package.json` script; `.github/workflows/ci.yml` required step | `pnpm verify:communications-data-model:postgres`; GitHub CI `verify` | Must pass locally and on the live PR #16 final head before merge; any new commit requires rerunning the gate |
| Production Readiness Review | `docs/phase-11/PHASE_11B_PRODUCTION_READINESS_REVIEW.md` | Required final disposition: `PRODUCTION_READINESS_REVIEW_PASSED` before any corrective implementation merge | Passed locally for the repaired corrective working tree; live PR #16 CI and Advisor merge approval remain authoritative at the merge gate |
| Repository validation | Workspace scripts and repository gates | `pnpm install --frozen-lockfile`; `pnpm verify`; `pnpm verify:production`; policy verifiers; `git diff --check`; secret-pattern scan | Focused validation, policy checks, and full `pnpm verify` must pass locally; GitHub CI must pass on the live PR #16 final head before merge |
| Advisor approval | Independent read-only Advisor review | Required disposition: `ADVISOR_APPROVED_FOR_MERGE` after final local validation and final-head CI | Must be obtained against the live PR #16 final head |

## Remaining Risks

- Phase 11B implementation is merged, but formal closure is blocked until the
  post-merge correctness remediation is reviewed, merged, validated, and
  incorporated into a new Phase 11B closure record.
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
| PRR and traceability evidence overstated final coverage before final remediated-head CI and Advisor approval. | HIGH | This document and the PRR now preserve local remediation evidence while requiring live PR #16 final-head CI and Advisor checks at the merge gate. | Final CI and Advisor review must be checked against the live PR #16 head before merge. |

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
| The named PostgreSQL verifier was absent from CI and could leak disposable containers. | HIGH | `package.json` root `verify` and `.github/workflows/ci.yml` now run `pnpm verify:communications-data-model:postgres`; the verifier now routes completion through cleanup-safe finalization. | PostgreSQL gate passes locally and must pass in GitHub CI on the live PR #16 final head. |
| PRR and traceability overclaimed passing final evidence while the merge gate was still rejected. | HIGH | PRR was reopened during remediation, then promoted to `PRODUCTION_READINESS_REVIEW_PASSED` only after local full validation passed; traceability separates local evidence from live final-head CI and Advisor gates. | Local full validation passed; live PR #16 CI and Advisor review remain required before merge. |

Final merge-gate Advisor review on 2026-07-28 returned `REJECTED`
because additional consent timing and TypeScript contract-parity findings
remained.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Consent Trust evidence omitted exact signed observed, effective, expiry, and revocation timing. | CRITICAL | Migration `0018` requires signed temporal evidence fields to match receipt timestamps exactly, requires explicit JSON null expiry/revocation where absent, and rejects invalid receipt chronology. | PostgreSQL omitted/mismatched observed/effective/expiry/revocation and invalid-chronology tests passed via `pnpm verify:communications-data-model:postgres` and `pnpm verify`. |
| TypeScript command authorization accepted database-invalid versions, scopes, actors, and permissions. | HIGH | Domain contract exports literal Phase 11B permission and policy versions and enforces the SQL operation/scope/actor/permission matrix. | Domain operation-matrix positive and negative tests passed via `pnpm --filter @bidayax/communications-domain test` and `pnpm verify`. |
| TypeScript Trust-reference contract rejected valid consent fields and accepted null Trust event linkage. | HIGH | Domain trust allowlist includes consent projection fields, requires non-empty Trust event IDs, and rejects domain/schema mismatches. | Domain consent-projection positive and missing-link/domain mismatch tests passed via `pnpm --filter @bidayax/communications-domain test` and `pnpm verify`. |
| CI workflow validation change lacked explicit file-scope coverage. | HIGH | Implementation plan now includes `.github/workflows/ci.yml` as PRR evidence-scope validation work. | `git diff --name-only origin/main` confirms the workflow file is in the amended scope. |
| Remote CI covered only prior PR head. | HIGH | Final remediated tree must be committed and pushed only after local validation and fresh Advisor approval for publishing; merge approval requires live final-head CI and a fresh Advisor merge gate. | GitHub CI must be verified against the live PR #16 final head before merge. |

Post-merge Phase 11B closure Advisor review on 2026-07-28 returned `REJECTED`
because PR #15 was merged but closure evidence could not be accepted while
Critical and High data-boundary defects remained. The closure draft was not
committed, pushed, or opened as a PR.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Authorization-decision metadata comparisons used SQL `<>`, allowing missing JSON keys to bypass operation, scope, permission, request-hash, session, or grant binding. | CRITICAL | Forward migration `0019_harden_communications_data_model_guards.sql` requires explicit keys and uses null-safe `IS DISTINCT FROM` comparisons. | PostgreSQL verifier rejects missing authorization metadata fields and cross-operation reuse. |
| Consent evidence comparisons used nullable JSON extraction with `<>`, allowing incomplete signed evidence to qualify a receipt. | CRITICAL | Migration `0019` requires consent receipt, channel, purpose, participant, policy, status, source, policy version, and temporal evidence fields. | PostgreSQL verifier rejects omitted consent identity and timing fields. |
| Trust events could omit `details.envelopeId` and still satisfy the envelope-reference check. | CRITICAL | Migration `0019` requires the Trust event `envelopeId` key and compares it null-safely to the cited envelope. | PostgreSQL verifier rejects a Trust event with the envelope link omitted. |
| Command authorization evaluated session and grant expiry against caller-writable `created_at`. | CRITICAL | Migration `0019` overwrites inserted command `created_at` with database wall-clock time and evaluates expiry against that trusted timestamp. | PostgreSQL verifier rejects backdated and delayed-in-transaction expired session/grant attempts. |
| The PostgreSQL verifier accepted unsafe database targets through substring database-name matching or unsupported URL protocols. | CRITICAL | `scripts/verify-communications-data-model-postgres.ts` now allows only `postgres:` and `postgresql:` URLs for the exact local disposable database name on local hosts and runs URL safety self-tests before connecting or applying migrations, including native `socket:`, unrelated schemes, query-parameter host, port, SSL, service, encoded, duplicated, and mixed-case override attempts plus remote IPv6 and Unix-socket-style host attempts. | `pnpm verify:communications-data-model:postgres` passes against the local disposable target, rejects unsafe URL examples internally, and rejects `socket://localhost/bidayax_phase11b_test` before connection. |
| TypeScript metadata validation accepted nested runtime objects, arrays, and malformed hash-designated values. | HIGH | `assertSafeCommunicationMetadata` rejects non-primitive runtime metadata values and enforces lowercase SHA-256 hex values for `requestHash`, `payloadHash`, `digest`, and `checksumSha256`; migration `0019` rejects nested named metadata values while preserving top-level structured policy arrays. | Domain tests reject nested object/array metadata and malformed hash-designated fields; PostgreSQL verifier rejects nested audit metadata and malformed hash-designated metadata fields. |
| Consent evidence could carry JSON-null `policyVersion` while still satisfying key-presence checks. | CRITICAL | Migration `0019` uses `IS DISTINCT FROM` to compare signed policy version to the cited consent policy version. | PostgreSQL verifier rejects omitted and JSON-null policy-version evidence. |
| Command authorization could use transaction-start time inside long-running transactions. | CRITICAL | Migration `0019` uses database wall-clock `clock_timestamp()` for command creation and terminal completion timestamps. | PostgreSQL verifier rejects delayed-in-transaction expired session and expired grant attempts. |
| The corrective remediation plan omitted its own amendment from the allowed-file manifest. | HIGH | `docs/phase-11/PHASE_11B_IMPLEMENTATION_PLAN.md` now lists itself in the bounded post-merge corrective remediation scope. | Final diff can be checked against the corrective manifest before commit. |

Corrective merge Advisor review after commit `228a4e097a1d7778300692d88ef58b7ae0c3bc45`
returned `ADVISOR_REJECTED_FOR_MERGE` because two High corrective gates
remained incomplete.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| SQL hash-designated metadata accepted non-string JSON primitives before hash validation. | HIGH | Migration `0019` now evaluates `requestHash`, `payloadHash`, `digest`, and `checksumSha256` before generic primitive acceptance and requires each hash-designated value to be a lowercase SHA-256 JSON string. | Domain tests reject null, number, boolean, object, array, empty, malformed, and uppercase values for all hash fields; PostgreSQL verifier rejects the same audit metadata values and Trust-reference payload-hash values. |
| Migration `0019` lacked a genuine 0018-to-0019 upgrade-path and constraint-revalidation gate. | HIGH | Migration `0019` now scans existing Communications metadata/evidence columns under the hardened predicate and raises fail-closed exceptions before accepting unsafe legacy rows. | PostgreSQL verifier applies through `0018`, seeds representative valid and invalid adapter-health metadata, applies `0019`, verifies valid data survives, verifies invalid legacy data blocks the upgrade, verifies metadata constraints are validated, and verifies invalid post-0019 writes fail. |

Final-head Advisor review on 2026-07-30 at
`5cfb7c3ea859edf18964323995aa2354930d7559` returned
`ADVISOR_REJECTED_FOR_MERGE` because migration `0019` did not yet revalidate
all legacy rows affected by the hardened authorization, consent, Trust, and
timestamp invariants.

| Finding | Severity | Remediation evidence | Validation evidence |
| --- | --- | --- | --- |
| Existing 0018 authorization, consent, Trust, and command timestamp evidence was not revalidated by `0019`. | CRITICAL | Migration `0019` now performs locked legacy-row scans under one lock boundary, terminally invalidates pre-0019 command idempotency rows as failed evidence requiring new command keys and fresh authorization, validates existing Trust evidence references against envelope, key, verification, signed payload, and Trust event linkage requirements, and validates existing consent receipts against required identity, timing, chronology, and policy-version evidence. | PostgreSQL verifier seeds valid legacy metadata/consent evidence and valid/invalid legacy command evidence plus invalid consent, Trust-event, and hash rows before applying `0019`; valid metadata and consent rows survive, legacy commands are preserved as failed reauthorization-required evidence, and invalid legacy states fail closed during upgrade. |
| The PostgreSQL upgrade gate did not cover legacy authorization, command timestamp, consent, or Trust evidence paths. | HIGH | `scripts/verify-communications-data-model-postgres.ts` now runs separate 0018-to-0019 scenarios for legacy command invalidation, missing consent evidence fields, missing Trust event envelope linkage, invalid hash metadata, valid consent survival, post-upgrade invalid writes, concurrent old-writer rejection, and metadata-constraint validation. | `pnpm verify:communications-data-model:postgres` reports the expanded 0018-to-0019 evidence string and passes. |
| PRR and traceability overstated migration safety after the rejected final-head review. | HIGH | PRR and traceability now record the `5cfb7c3` rejection, the locked legacy-row policy, the command invalidation behavior, and the expanded executable evidence. | Documentation is included in the corrective diff and must be revalidated by repository gates and fresh Advisor review. |

These remediations are a corrective Phase 11B implementation package. They do
not formally close Phase 11B; closure requires a new verified closure package
after this remediation is merged.
