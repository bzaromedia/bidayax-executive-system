# ADR-0002: Communications Data Model

## Status

Accepted

## Date

2026-07-25

## Owners

- BidayaX LLC
- Active Phase 11 Executor

## Decision

Phase 11B should define a tenant-scoped, communications-owned data model that
extends the existing telephony and trust foundations instead of creating a
parallel storage system.

This ADR becomes effective only when merged by PR #14. It authorizes Phase 11B
implementation entry only after every Phase Gate Policy entry requirement is
evidenced and an owner-approved implementation plan records the file scope. It
does not authorize provider integration, deployment, production activation,
Phase 11C behavior, Phase 12 work, or Wallet-related work.

## Context

ADR-0001 accepted the Communications Domain as the channel-neutral
orchestration boundary. Phase 11A is closed. The next linear subphase is Phase
11B Data Model planning.

The repository already contains communications-related persistence in
`database/migrations/0005_create_telephony_preparation.sql`,
`database/migrations/0016_create_telephony_domain_foundation.sql`, and
`database/migrations/0017_create_cryptographic_trust_layer.sql`. Phase 11B must
preserve tenant isolation, append-only audit evidence, trust-evidence
integrity, and production-disabled behavior while planning the future
communications-owned model.

## Problem Statement

The active architecture makes Communications the owner of policy,
orchestration, consent, suppressions, routing, audit, trust evidence, and
lifecycle authority. Existing storage still reflects earlier telephony-rooted
slices. Phase 11B must decide how Communications will own the canonical data
model while reusing compatible tables and avoiding dual writers.

## Scope

- Communications-owned entities and aggregates.
- Reuse, extension, or addition strategy for existing telephony tables.
- Tenant, card, participant, communication, consent, suppression, routing,
  lifecycle, dispatch, webhook, audit, trust, and receptionist-session data.
- Identifier, idempotency, concurrency, retention, deletion, migration,
  rollback, observability, and validation requirements.
- Boundaries between Communications, Telephony, Polyglot Receptionist, Trust,
  and dashboard queries.

## Non-Goals

- Migrations or schema changes outside the Phase 11B implementation package.
- Runtime orchestration behavior.
- Generated database clients outside the approved Phase 11B package.
- Provider selection or provider activation.
- Live webhook execution.
- Live inbound calls, outbound calls, voice, messaging, or scheduling.
- Phase 11C through 11I implementation.
- Phase 12 work.
- Wallet, payments expansion, cryptocurrency, digital assets, loyalty, rewards,
  or marketplace work.

## Domain Entities

The planned model should cover:

- `communication_request`
- `communication`
- `communication_participant`
- `communication_consent`
- `communication_suppression`
- `communication_routing_policy`
- `communication_business_hours_policy`
- `communication_lifecycle_transition`
- `communication_dispatch_attempt`
- `communication_webhook_evidence`
- `communication_summary`
- `communication_audit_event`
- `communication_trust_evidence_reference`
- `communication_receptionist_session`
- `communication_adapter_health`
- `communication_failover_event`

Existing telephony entities remain adapter or compatibility evidence until an
accepted Phase 11B implementation package changes write authority. Migration
`0005_create_telephony_preparation.sql` is legacy preparation evidence and may
not receive new Communications-owned writes unless a later implementation
package proves tenant scoping, ownership, and rollback safety.

## Aggregates and Ownership

The aggregate root should be a tenant-scoped `communication` or
`communication_request`, with participants, consent decisions, suppressions,
routing decisions, lifecycle transitions, dispatch attempts, and audit evidence
owned by Communications.

Telephony owns transport metadata only. Polyglot Receptionist owns intent,
conversation, language, and escalation context only. Trust owns cryptographic
envelopes, signed evidence, audit chains, and verification receipts.

## Identifiers and Idempotency

All command-side writes must carry tenant scope and an idempotency key. Card
scope must be explicit where applicable. Communication identifiers must not be
provider identifiers. Provider references must remain adapter metadata.

Idempotency keys must prevent duplicate command effects and must be safe to
retry after transient failures.

## Event Model

Phase 11B must preserve the Phase 11A event taxonomy from
`docs/phase-11/COMMUNICATIONS_DOMAIN_EVENTS.md` and decide which events become
durable database rows, trust-evidence references, or observability-only
signals.

Events must be immutable, versioned, tenant-scoped, and safe for trust evidence
without raw transcripts, raw audio, provider secrets, or sensitive payloads.

## Command Model

The data model must support the command types defined in
`packages/communications-domain/src/commands/index.ts`, including callback
requests, communication scheduling, communication initiation, inbound event
acceptance, escalation, suppressions, consent evaluation, routing evaluation,
status queries, termination, and tenant/platform kill switches.

## State Transitions

Canonical state belongs to Communications and must follow the channel-neutral
state machine in `docs/phase-11/COMMUNICATIONS_STATE_MACHINE_OWNERSHIP.md`.
Transport-native states from Telephony or later adapters must be normalized
before they affect product policy.

Terminal states must not re-enter active states. State transitions must be
append-only or otherwise durably auditable.

## Consent Records

Consent records must be tenant-scoped, card-scoped where applicable, channel
aware, purpose aware, versioned, jurisdiction tagged, and linked to evidence.
Recording, transcription, AI disclosure, revocation, source, and timestamp
fields must be explicit.

Consent policy and participant consent evidence are separate records. Policy
records define the rule version, jurisdiction, channel, purpose, disclosure,
and retention obligations. Participant consent observations or receipts record
the subject, source, evidence reference, effective time, expiry, revocation
state, and consented purpose. Missing, expired, ambiguous, purpose-mismatched,
channel-mismatched, stale, or revoked evidence must deny dispatch. Revocation
and dispatch must be transactionally ordered so a revocation race cannot permit
execution.

## Suppression Records

Suppression records must support participant-level and policy-level suppression,
expiration, release reason, authorized releaser, audit evidence, and
fail-closed evaluation.

## Audit Records

Audit records must include actor, command, reason, decision, tenant, card,
resource, occurred-at timestamp, and safe metadata. Denied actions must be
audited. Append-only behavior is required for durable audit evidence.

## Trust Evidence

Trust evidence must reference safe, sanitized communications facts. Raw
transcripts, raw audio, provider secrets, private keys, authorization tokens,
and raw provider payloads must not be stored in trust evidence.

The model must define linkage to the existing trust tables without duplicating
cryptographic storage. Phase 11B implementation must decide exact
Communications trust domains, artifact schemas, canonicalization versions, key
purposes, tenant-composite links, evidence-field allowlists, and rejection
rules before any trust rows are written. If the existing trust domain
constraints cannot represent Communications-owned evidence, the implementation
must extend the trust schema through a forward migration rather than misclassify
Communications evidence under another domain.

## Communications Routing Data

Routing data must cover business hours, language, overflow, emergency,
callback-required, priority, escalation, provider health, channel capability,
and kill-switch state. Caller input must not directly select providers.

## Receptionist-Session Data

Receptionist-session data must preserve the boundary that the receptionist can
request governed communications actions but cannot dispatch providers directly
or bypass consent, suppression, routing, kill-switch, or trust policy.

## Telephony Adapter Data Boundaries

Existing telephony tables may be reused or extended only where Communications
becomes the lifecycle, authorization, audit, and trust owner. Telephony may keep
transport-native provider references, call-leg details, DTMF, PSTN/SIP details,
and normalized transport health.

## Tenant Isolation

All Communications-owned rows must be tenant-scoped. Card-owned rows must use
card and tenant constraints that prevent cross-tenant references.

Phase 11B implementation must make table-by-table ownership decisions for all
reused, extended, deprecated, quarantined, or new tables. Every tenant-owned
relationship must use database-enforced tenant-composite references such as
`(tenant_id, resource_id)`, plus card scope where applicable. Session, callback,
transcript, recording, audit, routing, consent, suppression, trust, and
receptionist-session references must reject tenant or card mismatches at the
database boundary.

Cross-tenant and cross-card negative tests are required before implementation
closure. Disposable PostgreSQL tests must attempt mismatched inserts for every
child/session/reference pair and prove database-level rejection.

## Authorization Model

Every write path must resolve authenticated identity and permissions on the
server. Caller-supplied tenant, card, role, and permission claims are
non-authoritative. Sensitive commands require command-specific permissions,
resource ownership, reason, and audit evidence.

Communications records must bind actors to authoritative identity evidence:
user, service, or platform principal references; tenant membership; card grant
where applicable; session or delegated-authority context; authorization
decision ID; permission version; policy version; denial evidence; and audit
event linkage. Forged actor identifiers, revoked sessions or grants,
cross-tenant principals, suppression release attempts, and platform kill-switch
commands must fail closed in tests.

## Data Classification

Phase 11B must classify records as public-safe metadata, internal operational
metadata, sensitive communications metadata, consent/legal evidence, audit
evidence, trust evidence, or prohibited raw sensitive material.

## Encryption Requirements

Sensitive communications metadata must use repository-approved encryption at
rest and transport controls. Private keys, provider credentials, and production
secrets must stay outside application tables and repository files.

## Retention and Deletion

Retention and deletion rules must distinguish audit evidence, consent evidence,
trust evidence, operational metadata, transcripts, recordings, and provider
references. Jurisdiction-specific rules remain required before live execution.

## Privacy Requirements

The model must minimize personally identifiable information, avoid raw
transcripts and raw audio in trust evidence, redact provider payloads, and
preserve consent and suppression decisions.

Raw webhook bodies and raw provider payload bytes are transient signature
verification inputs by default. Durable storage may keep only hashes, provider
event identifiers, verification results, timestamps, and sanitized metadata
unless a later accepted implementation package records a legal basis,
segregated encrypted storage, strict read authorization, short TTL, deletion
evidence, and rollback behavior. Audit, trust, logs, metrics, traces, and
dashboard data must reject raw bodies, phone/email values where not explicitly
authorized, authorization headers, tokens, provider secrets, transcripts, audio,
and secret-like keys.

## Indexing and Query Patterns

Planned query patterns include tenant/card status views, lifecycle timelines,
participant communication history, suppression lookup, consent lookup,
idempotency lookup, routing policy evaluation, dispatch retry scans, webhook
deduplication, audit review, and trust-evidence lookup.

## Concurrency Controls

Implementation must define single-writer ownership, optimistic or append-only
state transition checks, idempotency uniqueness, safe retry behavior, and
transaction boundaries before migrations are authored.

## Migration Strategy

Phase 11B implementation must use forward-only migrations with rollback plans,
database-backed validation, compatibility checks against existing telephony
tables, and explicit dual-write prevention.

The implementation package must add or identify a named mandatory PostgreSQL
validation gate that applies the complete migration chain and verifies
constraints, tenant isolation, immutability, concurrency, idempotency,
rollback/roll-forward safety, dual-write prevention, and continued provider
dispatch disablement. The existing filename/sequence migration verifier is
necessary but not sufficient for Phase 11B closure.

## Rollback Strategy

Rollback must preserve production-disabled behavior, avoid provider access, and
restore service safety without deleting audit, consent, lifecycle, or trust
evidence. Rollback for forward-only migrations means disabling new writers,
disabling new readers where necessary, reverting composition roots, or applying
a corrective roll-forward migration. Rollback evidence must prove no
communications provider, VPS, production database, or production data was
accessed without authorization.

## Observability

The model must support metrics, logs, and events for policy decisions,
suppression hits, consent outcomes, lifecycle transitions, dispatch attempts,
adapter health, retries, blocked actions, and kill switches without sensitive
payload leakage.

## Alternatives Considered

- Keep Telephony as the data-model root. Rejected because ADR-0001 made
  Communications the domain owner and Telephony an adapter.
- Create a completely new Communications schema and ignore telephony tables.
  Rejected because it risks duplicate sources of truth and migration drift.
- Implement migrations immediately. Rejected because Phase 11B is currently
  planning only and requires accepted ADR coverage before implementation.

## Risks

- Existing telephony tables can be mistaken for permanent Communications
  ownership.
- Dual writers can appear during migration if cutover ownership is unclear.
- Consent, suppression, audit, and trust evidence can diverge if modeled as
  adapter-local concerns.
- Retention and deletion rules can be underspecified before live execution.

## Acceptance Criteria

- The Communications data model extends or reuses existing telephony and trust
  foundations without parallel ownership.
- Table-by-table ownership decisions classify existing tables as reused,
  extended, deprecated, quarantined, or adapter-local.
- Legacy migration `0005_create_telephony_preparation.sql` writes are
  quarantined or made safe before Communications-owned writes use them.
- All planned rows are tenant-scoped and card-scoped where applicable.
- Every tenant-owned relationship uses tenant-composite database constraints,
  plus card scope where applicable.
- Single-writer ownership and dual-write prevention are explicit.
- Consent policy records are separated from immutable participant consent
  evidence, and missing, stale, mismatched, or revoked consent denies dispatch.
- Suppression, audit, trust evidence, retention, privacy, and authorization
  requirements are defined.
- Raw webhook, PII, transcript, audio, token, provider-secret, and raw provider
  payload storage boundaries are enforced.
- Communications trust domains, artifact schemas, canonicalization versions,
  and evidence allowlists are defined.
- Migration, rollback, PostgreSQL validation, and observability requirements are
  defined.
- Phase 11B implementation remains locked until PR #14 is merged, this ADR or a
  superseding ADR is Accepted and effective, every Phase Gate Policy entry
  criterion is evidenced, and an implementation package is owner-approved.

## Test Strategy

Required future implementation tests include migration verification,
database-backed integration tests, tenant-isolation tests, cross-card negative
tests, tenant-composite foreign-key rejection tests, idempotency tests,
concurrency tests, append-only audit tests, consent and suppression tests,
revocation-versus-dispatch race tests, authorization tests, trust evidence
allowlist tests, raw payload and PII rejection tests, rollback or corrective
roll-forward tests, and repository verification.

## Completion Evidence

Phase 11B completion will require:

- accepted ADR-0002 or a superseding accepted ADR;
- implementation plan and approved work packages;
- migrations and rollback evidence if implementation is authorized later;
- database-backed validation;
- security and authorization test evidence;
- Advisor approval;
- merged Phase 11B closure record.

## Related ADRs

- `docs/adr/0001-communications-completion-boundary.md`

## Related Documents

- `docs/phase-11/COMMUNICATIONS_DATA_MODEL_PLAN.md`
- `docs/phase-11/COMMUNICATIONS_OWNERSHIP_MAP.md`
- `docs/phase-11/COMMUNICATIONS_SECURITY_BOUNDARY.md`
- `docs/phase-11/PHASE_11A_CLOSURE_RECORD.md`
- `docs/TELEPHONY_DATA_MODEL.md`
- `docs/TRUST_DATABASE.md`
- `database/migrations/0016_create_telephony_domain_foundation.sql`
- `database/migrations/0017_create_cryptographic_trust_layer.sql`
