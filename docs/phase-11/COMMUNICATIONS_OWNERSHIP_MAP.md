# Communications Ownership Map

Status: Accepted when PR #14 is merged
Phase: 11B planning

This map reconciles ADR-0001 and ADR-0002 for Phase 11B. Communications owns
the canonical product data model. Telephony remains an adapter and may retain
transport metadata. Existing telephony tables are not Communications write
targets unless the Phase 11B implementation proves tenant-composite safety,
single-writer ownership, and rollback behavior in a forward migration.

## Existing Table Ownership

| Existing area | Phase 11B storage status | Canonical writer | Adapter responsibility | Phase 11B rule |
| --- | --- | --- | --- | --- |
| `database/migrations/0005_create_telephony_preparation.sql` | Legacy preparation evidence | None for new Communications writes | None | Quarantined. Do not write Communications-owned rows to these tables. |
| `telephony_phone_numbers` | Adapter-local capability metadata | Telephony adapter | Store normalized number capability metadata only | Communications may reference through tenant-composite constraints only; it must not become the lifecycle writer for this table in Phase 11B. |
| `telephony_call_sessions` | Adapter-local transport session metadata | Telephony adapter | Store transport-native session references and call-leg details | Communications lifecycle must use a Communications-owned aggregate and may link to adapter sessions only by tenant-composite reference. |
| `telephony_callback_requests` | Legacy callback evidence | Existing legacy writer only until cutover | Execute transport only when a later phase authorizes dispatch | No new Communications ownership in Phase 11B unless a later accepted cutover ADR or implementation package supersedes this map. |
| `telephony_call_transcripts` | Adapter-local transcript metadata | Telephony adapter | Store transport references only | Raw transcript storage remains prohibited for Communications trust, audit, observability, and dashboard records. |
| `telephony_call_recordings` | Adapter-local recording metadata | Telephony adapter | Store transport references only | Raw audio storage remains prohibited for Communications trust, audit, observability, and dashboard records. |
| `telephony_consent_policies` | Legacy or adapter-local policy evidence | Existing legacy writer only until cutover | None | Phase 11B must create or identify Communications-owned consent policy records separately from participant consent receipts before dispatch can rely on consent. |
| `telephony_audit_events` | Adapter-local audit evidence | Telephony adapter | Record adapter transport audit only | Communications must create its own audit boundary or safe tenant-composite references; it must not use adapter audit as canonical product audit. |
| `telephony_routing_rules` | Adapter-local transport routing metadata | Telephony adapter | Store adapter routing capability only | Communications routing policy must be Communications-owned and cannot allow caller input to select providers. |
| `telephony_escalation_policies` | Adapter-local escalation metadata | Telephony adapter | Store transport escalation capability only | Communications escalation policy must be governed by Communications and receptionist boundaries before orchestration. |
| `telephony_emergency_policy_signals` | Adapter-local emergency signal metadata | Telephony adapter | Surface normalized transport signals only | Communications emergency handling remains policy-owned and dispatch-disabled until authorized later. |
| `telephony_usage_ledger` | Adapter-local usage evidence | Telephony adapter | Record transport usage only | Communications billing, revenue, Wallet, marketplace, rewards, and loyalty remain frozen and out of scope. |
| `trust_*` and `cryptographic_envelopes` | Trust-owned immutable evidence | Trust boundary | None | Communications may link only through explicit domains, artifact schemas, key purposes, tenant-composite links, and allowlisted sanitized fields. |
| `tenant_memberships`, `card_access_grants`, `application_sessions` | Identity-owned authorization evidence | Identity boundary | None | Communications actor records must reference authoritative identity, session, grant, authorization decision, permission version, and policy version evidence. |

## New Communications-Owned Records

Phase 11B implementation may introduce the Communications-owned records listed
in `docs/phase-11/PHASE_11B_IMPLEMENTATION_PLAN.md`. Those records, not the
legacy telephony tables above, become the canonical Phase 11B write boundary for
communication aggregates, participants, consent receipts, suppressions,
lifecycle transitions, command idempotency, dispatch-attempt state without
provider execution, webhook evidence, routing policy, receptionist-session
references, adapter-health references, trust-evidence references, and
append-only audit events.

## Future Cutover Rule

Any later decision to migrate canonical ownership into or out of an existing
telephony table requires a superseding ADR or an accepted amendment that records
the migration plan, dual-write prevention, rollback or corrective roll-forward
strategy, validation evidence, and Advisor approval.
