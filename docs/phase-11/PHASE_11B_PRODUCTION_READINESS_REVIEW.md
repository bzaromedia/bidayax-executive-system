# Phase 11B Production Readiness Review

Status: Reopened for post-merge Phase 11B corrective remediation
Date (America/Los_Angeles): 2026-07-28

This review covered PR #15, the Phase 11B Communications Data Model
implementation package, and is reopened for the post-merge Phase 11B
corrective remediation required by closure-gate review. It is evidence for
implementation and corrective merge readiness only. It does not close Phase
11B, authorize Phase 11C, activate providers, deploy production systems, or
unlock Wallet or other frozen work.

Required final disposition before any implementation or corrective merge:
`PRODUCTION_READINESS_REVIEW_PASSED`.

Current disposition: `PRODUCTION_READINESS_REVIEW_PASSED`.

PR #15 merged, but Phase 11B closure review rejected formal closure because
Critical and High post-merge correctness defects remained. This PRR has passed
for the repaired corrective working tree after focused and full local
validation were rerun. Remote CI and read-only Advisor merge review remain
separate required merge gates.

## Scope Reviewed

- PR: #15
- Branch: `feature/phase-11b-communications-data-model`
- Starting implementation commit:
  `577b102b4011978474cfb8efde1fd1d483eb40b8`
- PR #15 final implementation commit:
  `63c41728d92309bf340f96dc8f416dae65f70b56`
- PR #15 merge commit:
  `bbbb75b0c3a4b9696f22f5e32052706b15ba30cf`
- Active corrective branch:
  `fix/phase-11b-postmerge-correctness`
- Corrective PR: #16. Its final head, GitHub CI result, and merge Advisor
  disposition must be verified from live PR metadata before merge; any new
  commit invalidates the prior final-head gate.
- Governing ADR: `docs/adr/0002-communications-data-model.md`
- Governing plan:
  `docs/phase-11/PHASE_11B_IMPLEMENTATION_PLAN.md`
- Acceptance criteria:
  `docs/phase-11/PHASE_11B_ACCEPTANCE_CRITERIA.md`

## Architecture

Disposition: PASSED

Evidence:

- `packages/communications-domain/src/data-model/index.ts` defines the
  Communications-owned table set, safe metadata boundaries, trust evidence
  allowlist, data classifications, lifecycle transition checks, command
  idempotency draft validation, dispatch-attempt validation, and provider
  dispatch-disabled invariant.
- `services/communications/src/repositories/index.ts` adds repository
  contracts for data-model persistence without adding orchestration runtime.
- `database/migrations/0018_create_communications_data_model.sql` creates the
  Communications-owned persistence boundary without writing to legacy
  telephony preparation tables.
- `docs/phase-11/COMMUNICATIONS_OWNERSHIP_MAP.md`,
  `docs/DATABASE_MODEL.md`, and `docs/DATA_STRUCTURES.md` document the
  table-by-table ownership decisions and exclusions.

Findings:

- No duplicate persistence architecture was introduced.
- Telephony remains an adapter boundary and legacy preparation storage remains
  quarantined or adapter-local.
- No Phase 11C orchestration behavior, provider activation, UI redesign,
  deployment, Phase 12 work, or Wallet work is included.

## Security

Disposition: PASSED

Evidence:

- Migrations `0018` and `0019` enforce tenant/card composite relationships and
  reject null-card bypass attempts through database triggers.
- Command idempotency records require explicit card, tenant, or platform scope,
  actor type, authorization decision ID, required permission, permission
  version, and policy version. User card commands require authoritative tenant
  membership, active session evidence, and active card grant evidence. Service
  and platform commands require active Trust identities, explicit
  Communications kill-switch capabilities, exact operation/scope/request
  authorization-decision audit metadata, fixed Phase 11B permission/policy
  versions, required metadata keys, null-safe comparisons, and cannot borrow
  user authorization fields.
- Consent policy and consent receipt compatibility is enforced by card,
  channel, purpose, effective window, and durable consent trust-evidence
  references. Consent evidence must match receipt, participant, policy,
  channel, purpose, status, source, signed envelope payload, Trust event, active
  signing key, and valid envelope verification receipt.
- Queued dispatch attempts require exactly one active cited consent receipt, an
  active cited policy at evaluation time, serialized policy evaluation locks,
  immutable authorization fields, and fail closed when active suppression exists.
- Provider dispatch remains disabled by `provider_dispatch_enabled = FALSE`.
- Safe metadata checks reject authorization headers, tokens, secrets, private
  keys, raw bodies, raw payloads, transcripts, audio, phone values, email
  values, and secret-like fields.
- Trust evidence references use explicit Communications domains, artifact
  schemas, canonicalization version, the accepted tenant artifact signing key
  purpose, active unexpired Trust envelopes, active uncompromised signing keys,
  valid verification receipts, compatible Trust events, and allowlisted fields
  that must match the signed envelope payload.
- Audit, lifecycle, consent policy, consent receipt, command, webhook, summary,
  failover, and trust evidence are append-only where required. Suppression
  evidence permits only one controlled active-to-released transition with
  immutable scope, authorized release actor, release reason, and audit evidence.

Findings:

- No production credentials, provider credentials, private keys, raw provider
  payloads, transcripts, or audio are added.
- Known prior Critical and High closure-gate findings are remediated in the
  corrective working tree and covered by focused and full local validation.
  Remote CI and Advisor review remain required before corrective merge.

## Data

Disposition: PASSED

Evidence:

- Migration `0018` creates 18 Communications-owned tables with primary keys,
  foreign keys, tenant/card composite constraints, unique constraints, check
  constraints, append-only triggers, lifecycle sequencing, idempotency keys,
  dispatch policy checks, and query indexes. Migration `0019` hardens the
  existing guard triggers through a forward corrective roll-forward.
- The named PostgreSQL gate
  `pnpm verify:communications-data-model:postgres` applies the complete
  migration chain to the exact local disposable database target, rolls back
  transactional fixture data after verification, and uses a cleanup-safe
  completion path for disposable Docker PostgreSQL runs.
- Rollback is documented as disabling new writers/readers or corrective
  roll-forward without deleting audit, consent, lifecycle, or trust evidence.

Findings:

- The model is tenant-scoped, migration-safe, auditable, privacy-aware,
  idempotency-aware, concurrency-aware through lifecycle sequencing, durable
  uniqueness, and serialized consent/suppression policy evaluation locks, and
  compatible with later orchestration boundaries
  without implementing Phase 11C.
- No orphaned Communications-owned records or unrestricted cross-tenant query
  path is authorized by this implementation package.

## API And Contracts

Disposition: PASSED

Evidence:

- Domain contracts provide stable semantic status values for lifecycle,
  endpoint verification, consent, suppression, dispatch, trust evidence, and
  data classification.
- Repository contracts expose persistence operations only:
  `reserveCommandIdempotency`, `upsertParticipantEndpoint`,
  `appendLifecycleTransition`, `recordDispatchAttempt`, `linkTrustEvidence`,
  and `appendAuditEvent`.
- Error semantics are fail-closed at validation and database boundaries through
  explicit exceptions, constraints, and trigger rejection.

Findings:

- Contracts preserve retry, idempotency, audit, and authorization semantics.
- No presentation-specific strings, colors, layouts, device assumptions, or UI
  behavior are encoded into the domain model.

## Testing

Disposition: PASSED

Evidence:

- `packages/communications-domain/tests/data-model.test.ts` covers table-set
  declaration, telephony ownership decisions, metadata safety, hashed
  endpoints, command idempotency validation, scoped service/platform command
  records, dispatch-disabled and consent-cited dispatch attempts, trust
  evidence allowlist, lifecycle transitions, and audit draft validation.
- `services/communications/tests/data-model-repository-contract.test.ts`
  confirms repository persistence operations do not add runtime orchestration.
- `scripts/verify-communications-data-model-postgres.ts` validates clean
  PostgreSQL migration application, tenant/card isolation, idempotency,
  authorization denial, exact authorization-decision binding, consent trust
  evidence, verification receipts, suppression release controls, serialized
  policy-lock behavior, lifecycle sequencing and chronology, append-only
  evidence, adapter-health reason-code structure and privacy, business-hours
  policy, safe summary evidence, failover evidence, Trust envelope/event
  compatibility and payload projection, raw payload rejection, provider
  dispatch disabled behavior, and prohibited credential/raw columns.
- Full repository validation passed against the repaired corrective working
  tree. Remote CI and Advisor review remain required before corrective merge.

Findings:

- Database, authorization, tenant-isolation, consent, suppression, trust,
  audit, idempotency, concurrency, policy serialization, trust-linkage, and
  migration behavior are tested at the appropriate level for Phase 11B.
- UI/UX, live provider, end-to-end communications workflow, AI behavior, and
  production activation tests are not applicable to Phase 11B implementation
  and remain locked to future subphases.

## UI/UX Contract Impact

Disposition: PASSED

Evidence:

- Lifecycle, dispatch, consent, suppression, endpoint, adapter-health, webhook,
  business-hours policy, summary, failover, trust, and audit states are
  represented by stable semantic values.
- Timestamps are explicit across aggregate, lifecycle, consent, suppression,
  dispatch, webhook, adapter health, trust, and audit records.
- Raw user-entered contact values are intentionally not stored in presentation
  fields; endpoint values are represented by hashes and safe hints only.

Findings:

- The data contracts can support future deterministic pending, queued,
  in-progress, success, recoverable failure, terminal failure, retry, consent,
  suppression, business-hours, failover, and audit-visible UI states.
- No UI code, layout, visual design, or accessibility surface changed in PR
  #15.

## Operations

Disposition: PASSED

Evidence:

- The model includes observability-safe fields for lifecycle transitions,
  dispatch attempts, webhook evidence, adapter health, trust references, audit
  events, reason codes, retry counts, next retry times, provider event IDs,
  payload hashes, policy evaluation timestamps, business-hours policies, safe
  summary hashes, failover decisions, and policy versions.
- Privacy-safe metadata checks apply to durable metadata used by future logs,
  metrics, traces, dashboard data, trust evidence, webhook evidence, and audit
  events.

Findings:

- Operational diagnostics are supported without sensitive payload leakage.
- Alerting, dashboards, runbooks, staging evidence, and production monitoring
  remain future Phase 11G through 11I work and are not implemented here.

## Release Safety

Disposition: PASSED

Evidence:

- No production credential, production database, VPS, provider console,
  provider API, DNS, Nginx, firewall, production container, or production
  secret access is required or performed.
- Provider dispatch is explicitly disabled in the schema.
- Phase 11C through 11I, Phase 12 through 18, Wallet, payments expansion,
  cryptocurrency, digital assets, loyalty, rewards, marketplace, white-label,
  enterprise expansion, speculative AI additions, experimental UI, unrelated
  integrations, and Version 2 remain locked.

## Validation Evidence

Local validation has been rerun after the latest corrective repairs. Corrective
merge readiness still requires the final pushed corrective branch to have:

- passing local validation proportional to Phase 11B risk;
- passing named PostgreSQL validation;
- passing remote CI;
- no requested changes;
- no unresolved review threads;
- read-only Advisor disposition `ADVISOR_APPROVED_FOR_MERGE`.

## Defects And Deferrals

| ID | Severity | Description | Disposition | Owning phase |
| --- | --- | --- | --- | --- |
| 11B-PRR-001 | HIGH | Earlier Advisor found trust evidence allowlist enforcement incomplete. | Resolved in PR #15 before this PRR through domain validation, migration constraints, and PostgreSQL negative tests. | Phase 11B |
| 11B-PRR-002 | HIGH | Earlier Advisor found nullable card references could bypass tenant/card composite checks. | Resolved in PR #15 before this PRR through null-safe card-scope triggers and PostgreSQL negative tests. | Phase 11B |
| 11B-PRR-003 | HIGH | Earlier Advisor found receptionist-session legacy references were not tenant/card authoritative. | Resolved in PR #15 before this PRR by treating the legacy UUID as non-authoritative and enforcing scope through the Communications aggregate. | Phase 11B |
| 11B-PRR-004 | HIGH | Earlier Advisor found consent receipts could cite wrong-card or wrong-channel/purpose policies. | Resolved in PR #15 before this PRR through `enforce_communication_consent_policy_scope_v1` and PostgreSQL negative tests. | Phase 11B |
| 11B-PRR-005 | HIGH | Earlier Advisor found dispatch-attempt updates could bypass consent and suppression checks. | Resolved in PR #15 before this PRR by applying dispatch policy checks on insert and update. | Phase 11B |
| 11B-PRR-006 | HIGH | Final Advisor review found consent/suppression dispatch decisions used mutable caller-controlled timestamps and lacked serialization evidence. | Resolved by evaluating queued dispatch at database `now()`, making dispatch authorization fields immutable, locking policy subjects with transaction-scoped advisory locks, and adding PostgreSQL stale-policy, revocation, suppression, update, and lock-contention tests. | Phase 11B |
| 11B-PRR-007 | HIGH | Final Advisor review found command authorization did not model service/platform actors, command-specific permissions, or cardless tenant/platform commands. | Resolved by adding card/tenant/platform command scopes, actor type fields, required permissions, user-session/card-grant checks, service identity references, platform command shape checks, and PostgreSQL negative tests. | Phase 11B |
| 11B-PRR-008 | HIGH | Final Advisor review found aggregate lifecycle state could be bypassed through direct aggregate updates or invalid initial states. | Resolved by forcing aggregate creation to `requested` version 0, permitting state/version changes only inside lifecycle-transition trigger execution, and adding PostgreSQL invalid-initial/direct-update tests. | Phase 11B |
| 11B-PRR-009 | HIGH | Final Advisor review found Trust evidence references were not compatible with existing Trust envelope domains and could cite null or mismatched Trust evidence. | Resolved by extending accepted Trust envelope domains for Communications, enforcing domain/schema/envelope/trust-event compatibility, and adding PostgreSQL positive and negative Trust-link tests. | Phase 11B |
| 11B-PRR-010 | HIGH | Final Advisor review found raw phone-number hints could bypass sensitive metadata checks. | Resolved by strengthening endpoint and JSON metadata phone-pattern rejection and adding domain and PostgreSQL negative tests. | Phase 11B |
| 11B-PRR-011 | HIGH | Final Advisor review found evidenceless or stale consent could qualify active. | Resolved by requiring consent evidence references, making consent policies append-only, joining active policy windows during dispatch evaluation, and adding PostgreSQL missing-evidence/stale-policy tests. | Phase 11B |
| 11B-PRR-012 | MEDIUM | Final Advisor review found ADR-0002 tables for business hours, summaries, and failover evidence were missing. | Resolved by adding Communications-owned `communication_business_hours_policies`, `communication_summaries`, and `communication_failover_events` with scope, safety, disabled-provider, and append-only tests. | Phase 11B |
| 11B-PRR-013 | MEDIUM | Final Advisor review found the PostgreSQL gate overclaimed coverage. | Resolved by expanding the verifier evidence list and tests to match actual behavior: policy serialization, trust linkage, command scopes, lifecycle guards, missing ADR tables, and append-only evidence. | Phase 11B |
| 11B-PRR-014 | MEDIUM | Final Advisor review found the PRR governance delta was not listed in the implementation plan or decision log. | Resolved by updating the implementation plan evidence scope and recording the PRR gate decision in `docs/codex/DECISION-LOG.md`. | Phase 11B |
| 11B-PRR-015 | MEDIUM | Production operations dashboards, alerts, runbooks, and staging evidence are not part of Phase 11B. | Deferred with explicit lock; they are required in Phase 11G through 11I before activation. | Phase 11G-11I |
| 11B-PRR-016 | MEDIUM | Product-wide UI/UX and accessibility certification is not part of Phase 11B. | Deferred with explicit lock; future production readiness requires a dedicated UI/UX certification gate. | Phase 12 or later approved certification phase |
| 11B-PRR-017 | CRITICAL | Latest Advisor review found exact-channel policy locks could miss wildcard consent or suppression rows, and the previous verifier counted any second-connection error as contention. | Resolved by hierarchical advisory locks covering exact, channel-wildcard, purpose-wildcard, and full wildcard subjects, committed-schema two-connection verification, and SQLSTATE `57014` contention assertion. | Phase 11B |
| 11B-PRR-018 | CRITICAL | Latest Advisor review found command authorization could accept nonexistent or unbound platform actors and did not prove command-specific permissions. | Resolved by tenant-bound service and platform identity FKs, active identity checks, command-specific card grant permission checks, exact operation registration, and PostgreSQL user/service/platform denial tests. | Phase 11B |
| 11B-PRR-019 | CRITICAL | Latest Advisor review found command, idempotency, and dispatch contracts were mismatched, including unregistered operations, cardless dispatch linkage, and append-only command outcomes. | Resolved by exact command operation checks, non-null dispatch card scope, registered-operation persistence coverage, and controlled reserved-to-terminal command result updates with immutable request and authorization evidence. | Phase 11B |
| 11B-PRR-020 | CRITICAL | Latest Advisor review found Communications trust domains were accepted in the data migration but rejected by the Trust runtime, and trust references could omit durable Trust links. | Resolved by registering Communications domains in `packages/trust`, adding Trust tests, requiring compatible envelope or trust-event linkage, and adding PostgreSQL missing-link and mismatch tests. | Phase 11B |
| 11B-PRR-021 | CRITICAL | Latest Advisor review found aggregate lifecycle protection was forgeable through a caller-set session setting. | Resolved by requiring lifecycle state changes to occur during lifecycle trigger execution and adding a forged-setting PostgreSQL rejection test. | Phase 11B |
| 11B-PRR-022 | HIGH | Latest Advisor review found bare numeric and formatted phone values were not rejected consistently from metadata and endpoint hints. | Resolved by expanding phone-pattern detection in TypeScript and SQL and adding `+15555550123`, `15555550123`, and `(555) 555-0123` domain tests plus PostgreSQL metadata tests. | Phase 11B |
| 11B-PRR-023 | HIGH | Latest Advisor review found suppression release integrity lacked authoritative reason, actor, audit linkage, and immutable scope. | Resolved by requiring release actor, release reason, and audit event for the only permitted active-to-released transition, binding suppression actors to tenant memberships, keeping active suppressions audit-link-free until release, preserving immutable suppression scope, and rejecting direct released inserts, double releases, and deletes. | Phase 11B |
| 11B-PRR-024 | HIGH | Latest Advisor review found receptionist-session references could cite arbitrary UUIDs without a tenant/card-safe owner. | Resolved by rejecting non-null legacy receptionist interaction UUIDs until a later accepted cutover defines authoritative tenant/card-safe receptionist ownership. | Phase 11B |
| 11B-PRR-025 | HIGH | Latest Advisor review found PRR and traceability evidence overstated coverage after a rejected review and before final CI on the remediated head. | Resolved by updating PRR and traceability evidence to identify pending final Advisor approval, CI, and final PR head validation separately from local remediation evidence. | Phase 11B |
| 11B-PRR-026 | CRITICAL | Final pre-commit Advisor review found consent receipt `evidence_reference_id` was unbound durable-looking text, and dispatch only checked non-null evidence. | Resolved by binding consent receipts to Communications trust evidence references and requiring matching consent domain, artifact schema, card, receipt ID, channel, and policy version; PostgreSQL verifier covers missing, nonexistent, and mismatched consent evidence. | Phase 11B |
| 11B-PRR-027 | CRITICAL | Final pre-commit Advisor review found tenant/platform kill-switch authorization accepted weak service/platform identities and unbound authorization decisions. | Resolved by requiring owner/admin user role for tenant kill switch, active service/platform Trust identities with explicit kill-switch capabilities, and matching durable authorization-decision audit evidence; verifier covers viewer, unprivileged, disabled, cross-tenant, and forged actors. | Phase 11B |
| 11B-PRR-028 | CRITICAL | Final pre-commit Advisor review found command records could be inserted directly in terminal states and contracts lacked a controlled result path. | Resolved by rejecting terminal command inserts, preserving immutable request/authorization evidence, allowing only reserved-to-terminal result updates, and adding the repository `completeCommandIdempotency` contract. | Phase 11B |
| 11B-PRR-029 | CRITICAL | Final pre-commit Advisor review found trust linkage could rely on event-only references, overly broad key purposes, and unsigned evidence projections. | Resolved by requiring a compatible cryptographic envelope, limiting Communications trust references to tenant artifact signing, and enforcing exact evidence-field equality with the signed envelope payload. | Phase 11B |
| 11B-PRR-030 | HIGH | Final pre-commit Advisor review found audit, summary, and suppression actor evidence could cite weak or unbound actor identifiers. | Resolved by binding audit and summary user/service/platform actors to active tenant membership or Trust identities, and by binding suppression create/release actors to active authorized memberships. | Phase 11B |
| 11B-PRR-031 | HIGH | Final pre-commit Advisor review found adapter-health `reason_codes` could carry sensitive diagnostics. | Resolved by applying the safe metadata predicate to adapter-health reason-code arrays and adding PostgreSQL phone-number rejection coverage. | Phase 11B |
| 11B-PRR-032 | HIGH | Final pre-commit Advisor review found negative PostgreSQL tests could pass on any database error. | Resolved by requiring every negative verifier case to declare and match an expected failure pattern. | Phase 11B |
| 11B-PRR-033 | MEDIUM | Final pre-commit Advisor review found the phone detector rejected ISO dates. | Resolved by narrowing the phone-number regex while preserving explicit phone-pattern rejection and adding a positive ISO-date metadata test. | Phase 11B |
| 11B-PRR-034 | MEDIUM | Final pre-commit Advisor review found lifecycle transition timestamps could be backdated against aggregate chronology. | Resolved by rejecting transitions older than the current aggregate `updated_at` and adding PostgreSQL backdated-transition coverage. | Phase 11B |
| 11B-PRR-035 | CRITICAL | Final Advisor and sidecar review found platform kill-switch authorization could be borrowed by a user and authorization decisions were not bound to exact operation, scope, permission, and request evidence. | Resolved in the working tree by enforcing the operation/scope/actor matrix, exact authorization-decision metadata, fixed Phase 11B permission/policy versions, and PostgreSQL negatives for user platform kill-switch, cross-operation reuse, and forged versions. | Phase 11B |
| 11B-PRR-036 | CRITICAL | Final Advisor and sidecar review found consent trust evidence did not prove the cited policy version, active envelope, Trust event, signing key, or verification receipt. | Resolved in the working tree by requiring signed consent projections, matching policy/receipt/participant/purpose/status/source, active unexpired envelopes, active uncompromised keys, Trust event binding, and valid verification receipts. | Phase 11B |
| 11B-PRR-037 | CRITICAL | Final Advisor review found lifecycle state changes cited unconstrained authorization text. | Resolved in the working tree by requiring a resource-matched `communication.authorization_decision` audit event for every lifecycle transition. | Phase 11B |
| 11B-PRR-038 | CRITICAL | Final Advisor review found command result/replay semantics were contradictory. | Resolved in the working tree by limiting persisted command status to `reserved`, `completed`, or `failed`, treating replay as a repository return outcome, and enforcing operation-specific terminal result rules. | Phase 11B |
| 11B-PRR-039 | HIGH | Sidecar review found the PostgreSQL verifier could leak disposable containers by calling `process.exit()` before cleanup. | Resolved in the working tree by routing pass/fail/block completion through a cleanup-safe finalizer and rerunning the PostgreSQL gate twice. | Phase 11B |
| 11B-PRR-040 | HIGH | Sidecar review found adapter-health reason-code structure was under-tested. | Resolved in the working tree by requiring reason-code arrays to contain bounded uppercase string codes only and adding non-string, nested, prose, oversized, and phone-like rejection tests. | Phase 11B |
| 11B-PRR-041 | HIGH | Sidecar review found summary and suppression expected-failure registry entries without executable coverage. | Resolved in the working tree by adding summary missing-grant, suppression audit-reuse, and suppression wrong-reason tests. | Phase 11B |
| 11B-PRR-042 | CRITICAL | Final merge-gate Advisor review found consent Trust evidence did not bind `observed_at`, `effective_at`, `expires_at`, and `revoked_at` exactly to the signed projection. | Resolved by requiring signed observed, effective, expiry, and revocation fields with exact timestamp equality and receipt chronology; PostgreSQL verifier adds omitted and mismatched timing negatives. | Phase 11B |
| 11B-PRR-043 | HIGH | Final merge-gate Advisor review found TypeScript command authorization contracts accepted database-invalid versions, actors, scopes, and permissions. | Resolved by exporting literal Phase 11B permission/policy versions and enforcing the migration's operation/scope/actor/permission matrix. | Phase 11B |
| 11B-PRR-044 | HIGH | Final merge-gate Advisor review found TypeScript Trust-reference contracts rejected valid consent projection fields while accepting null Trust event linkage. | Resolved by adding consent projection fields to the domain allowlist, requiring Trust event IDs, and checking domain/schema compatibility before persistence. | Phase 11B |
| 11B-PRR-045 | HIGH | Final merge-gate Advisor review found the CI workflow file was not explicitly authorized in the Phase 11B PRR remediation scope. | Resolved by amending the implementation plan to list `.github/workflows/ci.yml` as PRR evidence-scope validation work. | Phase 11B |
| 11B-PRR-046 | HIGH | Final merge-gate Advisor review found the reviewed tree was dirty and remote CI covered only the prior PR head. | Resolved by requiring live PR #16 final-head GitHub CI and fresh Advisor merge approval after every pushed corrective commit. | Phase 11B |
| 11B-PRR-047 | CRITICAL | Post-merge closure Advisor found authorization-decision metadata could omit required keys and bypass SQL `<>` comparisons through NULL. | Resolved in the corrective branch by migration `0019`, which requires keys and uses `IS DISTINCT FROM`; PostgreSQL verifier covers omitted operation, scope, permission, request hash, session, and grant metadata. | Phase 11B |
| 11B-PRR-048 | CRITICAL | Post-merge closure Advisor found consent evidence could omit receipt, channel, purpose, participant, policy, status, or source fields and still qualify. | Resolved in the corrective branch by migration `0019` required-key checks and PostgreSQL omitted-field negatives. | Phase 11B |
| 11B-PRR-049 | CRITICAL | Post-merge closure Advisor found Trust events could omit the cited `envelopeId`. | Resolved in the corrective branch by migration `0019` Trust event required-key and null-safe envelope comparison; PostgreSQL verifier covers omitted event envelope linkage. | Phase 11B |
| 11B-PRR-050 | CRITICAL | Post-merge closure Advisor found caller-writable command `created_at` could be backdated to evade session or grant expiry. | Resolved in the corrective branch by migration `0019` database-owned command creation time and PostgreSQL backdated expired session/grant negatives. | Phase 11B |
| 11B-PRR-051 | CRITICAL | Post-merge closure Advisor found the PostgreSQL verifier could target an unintended remote or production-like database before rollback. | Resolved in the corrective branch by exact local disposable database URL policy and pre-connection URL safety self-tests covering protocol allowlisting, native `socket:` rejection, non-local hosts, exact database-name enforcement, query-parameter host/port/SSL/service overrides, encoded and duplicated parameters, mixed-case parameters, remote IPv6, and Unix-socket-style host attempts. | Phase 11B |
| 11B-PRR-052 | HIGH | Post-merge closure Advisor found TypeScript metadata validation accepted nested runtime payloads and diverged from the Phase 11B flat durable-metadata contract. | Resolved in the corrective branch by rejecting non-primitive metadata values in TypeScript and by tightening migration `0019` so named metadata fields cannot carry nested object or array values while top-level structured policy arrays remain supported. Domain and PostgreSQL verifier tests cover nested object/array rejection. | Phase 11B |
| 11B-PRR-053 | CRITICAL | Corrective Advisor review found consent Trust evidence could carry JSON-null `policyVersion` and bypass nullable `<>` comparison. | Resolved in the corrective branch by using `IS DISTINCT FROM` for policy-version comparison and adding omitted/null policy-version PostgreSQL negatives. | Phase 11B |
| 11B-PRR-054 | CRITICAL | Corrective Advisor review found transaction-start `now()` could stale-date command authorization inside a long-running transaction. | Resolved in the corrective branch by using database wall-clock `clock_timestamp()` for command creation and terminal completion timestamps and adding delayed-in-transaction expired session/grant negatives. | Phase 11B |
| 11B-PRR-055 | HIGH | Corrective Advisor review found the implementation plan omitted itself from the corrective file-scope manifest. | Resolved by listing `docs/phase-11/PHASE_11B_IMPLEMENTATION_PLAN.md` in the bounded post-merge corrective remediation scope. | Phase 11B |
| 11B-PRR-056 | CRITICAL | Corrective merge Advisor found the PostgreSQL verifier accepted native `socket:` URLs because the URL guard did not restrict protocols. | Resolved by allowing only `postgres:` and `postgresql:` protocols, adding native `socket:` and unrelated-scheme rejection self-tests, and proving `socket://localhost/bidayax_phase11b_test` is rejected before connection. | Phase 11B |
| 11B-PRR-057 | HIGH | Corrective merge Advisor found TypeScript accepted malformed values for SQL hash-designated metadata fields: `requestHash`, `payloadHash`, `digest`, and `checksumSha256`. | Resolved by enforcing lowercase SHA-256 hex digests for those metadata keys in TypeScript, tightening SQL named metadata-field handling in migration `0019`, and adding domain plus PostgreSQL verifier negatives. | Phase 11B |

## Formal PRR Decision

- Decision: `PRODUCTION_READINESS_REVIEW_PASSED`
- Scope: PR #15 Phase 11B Communications Data Model implementation and the
  post-merge Phase 11B corrective remediation.
- Merge condition: the corrective branch must pass final local validation,
  remote CI, and read-only Advisor merge approval before it can merge.
- Non-closure statement: This PRR does not formally close Phase 11B.
- Next required record after corrective merge:
  a recreated `docs/phase-11/PHASE_11B_CLOSURE_RECORD.md` on a separate
  closure branch from verified `main`.
