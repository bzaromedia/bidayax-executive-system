# Executive Card™ — BXSS™ 2 + ESIP™ Authority and Applicability Contract

**Record ID:** `EXECUTIVE-CARD-BXSS2-ESIP-AUTHORITY-001`  
**Effective date:** 2026-09-21  
**Project:** BidayaX Executive System™ / The Executive Card™  
**Repository:** `D:\bidayax-executive-system`  
**Preserved GREEN baseline:** `1ce4a94426717c52d361cbf99dbb890281eda6b6`  
**Operating mode:** BXSS™ 2 Local Sovereign Build Mode  
**EC-1 scope:** governance and applicability authority only.

## 1. Executive decision

The Executive Card adopts the full current BXSS™ 2 architecture that applies to the product.

Partial adoption is prohibited.

EC-1 does not install runtime code, activate providers, mutate services, alter database state, change Docker runtime behavior, bypass Phase 11 ordering, or claim production readiness.

The product's existing validated architecture is preserved and mapped into BXSS™ 2 rather than replaced blindly.

## 2. Authority hierarchy

When two authorities appear to conflict, use this precedence:

1. current explicit owner direction;
2. current canonical BXSS™ 2 standards and profiles;
3. accepted Executive Card product-specific governance, ADRs, phase locks, and safety controls;
4. older BXSS™ 2 adoption material only where it has not been superseded.

No generic BXSS artifact may silently invalidate an Executive Card phase lock or product-specific safety control.

A conflict requires an explicit reconciliation record.

## 3. Canonical BXSS invariants

The canonical BXSS registry remains:

- exactly 48 numbered systems;
- exactly 6 runtime planes;
- no seventh plane may be created by an Executive Card integration;
- BOME™ and BAGE™ remain non-numbered composite subsystems;
- every one of the 48 systems must appear in the project capability-consumption record;
- each system must be classified as exactly one of:
  - `ACTIVE_REQUIRED`
  - `CONTRACT_REQUIRED`
  - `DEFERRED`
  - `NOT_APPLICABLE`
  - `PROHIBITED`

No system may disappear merely because an existing Executive Card package performs a similar function.

Existing capabilities must be mapped to canonical BXSS jurisdiction, not duplicated without evidence that a separate implementation is required.

No `BXSS2_PROJECT_READY`, `UI_GREEN`, `RUNTIME_GREEN`, or equivalent readiness claim may be made until the complete registry and applicable evidence gates are present and validated.

## 4. Mandatory Executive Card profiles and governance

The Executive Card must inherit and apply, where relevant:

- Preventability-First governance;
- MISP™ / DIL-12™ consequential-action decisions using `{ALLOW, ASK, DENY}`;
- BIF-12™ Behavioral Invariance & Falsification as a profile, not a new system or plane;
- ESIP™ Enterprise Systems Integration Profile as a mandatory profile/plugin;
- Adaptive API™ as the provider/protocol/capability abstraction boundary;
- Design System as Control Plane;
- VIRP-12™ for approved visual reconstruction;
- A0 provenance and sovereign-rights controls;
- BOME™ procedure/evidence lineage where governed execution occurs;
- SREX™ reliability, monitoring, recovery, drift and operational evidence;
- evidence-grade Runtime-GREEN qualification rather than readiness by assertion.

## 5. ESIP™ Executive Card execution path

Canonical governed enterprise interaction path:

`AI / Agent / HAGI`
→ `Governed Intent`
→ `MISP / DIL-12 {ALLOW, ASK, DENY}`
→ `Governed Domain Service`
→ `Adaptive API`
→ `Typed Contract / Schema Validation`
→ `Identity / Authorization / Policy`
→ `Idempotency / Concurrency / State-Version Control`
→ `Enterprise-System Adapter`
→ `ERP / CRM / HRIS / SCM / WMS / Financial / Legacy System`
→ `Post-execution Verification / Reconciliation`
→ `BOME Evidence / Provenance / Attestation / Observability`
→ `SREX Monitoring / Recovery`

ESIP creates neither a new numbered BXSS system nor a new runtime plane.

Direct enterprise-system coupling is prohibited.

## 6. Native repository mapping

### Identity and authority

- `packages/identity`
- migration `0015_create_identity_provider_integration.sql`

### Executive Event Ledger

- `apps/card/app/api/events/route.ts`
- migration `0001_create_interaction_events.sql`

### Intent intelligence

- `services/intent-scoring`
- migration `0002_create_intent_scores.sql`

### Executive Contact Graph

- `services/contact-graph`
- migration `0003_create_contact_graph.sql`

### Receptionist domain

- `services/receptionist-agent`
- `services/polyglot-receptionist`
- `packages/receptionist-core`
- `packages/receptionist-runtime`

### Communications authority

- `packages/communications-domain`
- `services/communications`
- migrations `0018` and `0019`

### External capability adapters

- `services/telephony`
- `services/voice-gateway`

These adapters must not become the domain authority.

### Trust and provenance

- `packages/trust`
- migration `0017_create_cryptographic_trust_layer.sql`
- `docs/PROVENANCE_MANIFESTS.md`

### Workflow and policy

- `packages/workflow-engine`
- `services/policy-enforcement`

### Observability

- `services/telemetry`
- Dashboard observability surfaces

### Design System Control Plane

- `packages/design-system`
- `packages/tokens`
- `packages/ui`
- `apps/card`
- `apps/dashboard`

## 7. Data-authenticity invariant

Production runtime business data must be authoritative.

Prohibited runtime patterns:

- fabricated business data;
- demo business values presented as live values;
- mock business records;
- silent hard-coded operational truth;
- source-of-truth defaults presented as if they were persisted tenant state.

When authoritative data is absent, the product must render an explicit state such as:

- unavailable;
- unconfigured;
- disabled;
- empty;
- denied;
- pending;
- conflict;
- error.

Mocks remain permitted inside bounded test code.

The existing runtime telephony `"mock"` fallback and ambiguous database-unconfigured display behavior are recorded as future corrective work and are not changed in EC-1.

## 8. Commercial Intelligence and Evidence Layer

The Commercial Intelligence and Evidence Layer is a formal Executive Card BXSS™ 2 requirement.

It is a governed composition.

It is not:

- a seventh runtime plane;
- a 49th BXSS system;
- an uncontrolled third-party analytics authority;
- a second event ledger.

It must compose existing governed capabilities for:

- metric definitions;
- governed telemetry;
- cost attribution;
- commercial evidence;
- cohort governance;
- value and unit-economics measurement;
- payment evidence;
- pricing hypotheses;
- internal executive commercial visibility.

### Required commercial capabilities

1. Commercial Metric Registry.
2. Founding 100 cohort authority.
3. Cost Attribution Ledger.
4. Commercial Evidence Ledger.
5. Pricing Hypothesis Registry.
6. Provider-neutral Payment Evidence.
7. Internal Commercial Command Center.
8. Data-completeness and evidence-quality status.

## 9. Founding 100

Founding 100 is the controlled evidence cohort.

Rules:

- target cohort size: 100 real participants;
- synthetic participants are prohibited;
- cohort membership must be explicit and auditable;
- commercial metrics must be defined before cohort measurement begins;
- historical analytics must not be retrofitted to manufacture missing evidence;
- pricing remains a hypothesis until supported by evidence.

## 10. Payment rails

Payments must use a governed abstraction.

Adaptive API is the canonical provider-neutral boundary.

Crypto is the preferred payment-rail class, but preference does not authorize direct coupling to:

- a cryptocurrency network;
- a wallet provider;
- a payment processor;
- a fiat processor;
- a specific settlement provider.

Normalized payment capabilities must support governed equivalents of:

- payment intent creation;
- authorization;
- settlement;
- status query;
- refund;
- reversal where applicable.

Provider identity must remain replaceable without changing Executive Card domain semantics.

## 11. UI authority

Approved Executive Card UI is product Source of Truth.

The runtime must follow:

`Approved Visual SoT`
→ `Design System Control Plane`
→ `Typed Query / Command Contract`
→ `Governed Domain Service`
→ `Authoritative State`
→ `Explicit Runtime State`
→ `Evidence / Telemetry Correlation`

Generic SaaS styling is prohibited.

The post-core public site must inherit the same approved Executive Card visual language.

## 12. Phase ordering

At EC-1 entry:

- Phase 11B remediation exists.
- Phase 11B is not yet formally closed.
- Phase 11C and subsequent communications runtime work remain locked.
- BXSS™ 2 adoption does not erase this ordering.
- ESIP™ does not erase this ordering.
- Commercial work does not erase this ordering.

The next runtime-affecting phase cannot begin until the applicable phase gate is explicitly satisfied.

## 13. EC-1 closure rule

Creating this document establishes product-native governance authority.

It does not by itself prove complete BXSS adoption.

Before complete BXSS™ 2 adoption may be claimed, the project must materialize and validate:

- canonical 48-system registry;
- six-plane invariant;
- Executive Card project profile;
- adoption record;
- capability-consumption record containing exactly 48 classified systems;
- current mandatory profile overlays including ESIP;
- project-specific evidence and readiness gates.

Until then, the correct state is:

`AUTHORITY CONTRACT ESTABLISHED — FULL ADOPTION NOT YET PROVEN`.
