# Executive Card™ — Controlled Integration Gate Ledger

**Ledger ID:** `EXECUTIVE-CARD-EC-GATES-001`  
**Effective date:** 2026-09-21  
**Baseline:** `1ce4a94426717c52d361cbf99dbb890281eda6b6`

This ledger controls the current Executive Card BXSS™ 2 + ESIP™ integration sequence.

A later gate may not silently bypass an earlier locked gate.

| Gate | Classification | Status | Authority / objective | Runtime mutation allowed? | Exit requirement |
|---|---|---|---|---:|---|
| EC-0 | Core | GREEN | Reconcile actual repository against recovered GREEN Source of Truth. | No | Clean baseline, preserved lineage, healthy authoritative runtime. |
| EC-1 | Core governance | ACTIVE | Establish Executive Card-native BXSS™ 2 + ESIP™ authority/applicability contract and controlled gate ledger. | No | Contract and ledger created; baseline preserved; canonical 48-system applicability still explicitly unresolved until materialized. |
| EC-2 | Core | LOCKED | Validate and formally close Phase 11B remediation. | Validation only until authorized closure work | Authoritative verification passes and accepted Phase 11B closure evidence exists. |
| EC-3 | Core | LOCKED | Bind current BXSS governance to product-native runtime boundaries: MISP/DIL-12, Preventability, BIF-12, Adaptive API, Trust/A0, BOME, SREX. | Yes, controlled | Contract/evidence gates GREEN. |
| EC-4 | Core | LOCKED | Enforce production data authenticity and remove runtime mock/default-business-state ambiguity. | Yes, controlled | No production mock/demo/fake business state; explicit unavailable states proven. |
| EC-5 | Core | LOCKED | Weld approved Executive Card UI end-to-end to authoritative services and data. | Yes, controlled | Approved screens reconstruct correctly and consume governed real-data contracts. |
| EC-6 | Core | LOCKED | Activate ESIP-native enterprise integration boundaries. | Yes, controlled | Typed contracts, identity, policy, idempotency, concurrency, reconciliation, drift, resilience and evidence proven. |
| EC-7 | Commercial seam | LOCKED | Activate Commercial Intelligence and Evidence Layer. | Yes, controlled | Predefined metrics, cohort authority, cost attribution, payment abstraction, evidence ledger and Commercial Command Center proven. |
| EC-8 | Commercial seam | LOCKED | Operate Founding 100 as controlled evidence cohort. | Operational | 100 real cohort participants governed; measurements evidence-backed; pricing remains hypothesis unless validated. |
| EC-9 | Core + commercial | LOCKED | Enterprise Production / Commercial Ship Gate. | Promotion only | Security, runtime, UI, ESIP, evidence, resilience, deployment and commercial-control gates GREEN. |
| EC-P | Post-core | LOCKED | Public site, public pricing presentation and acquisition surface. | Post-core only | EC core architecture stable; approved Executive Card visual language, payment abstraction and pricing authority inherited. |

## EC-1 prohibited actions

During EC-1 do not:

- modify application runtime behavior;
- modify services;
- add database migrations;
- alter existing migrations;
- activate providers;
- choose a payment provider;
- choose a cryptocurrency network;
- redesign approved UI;
- bypass Phase 11 ordering;
- claim `BXSS2_PROJECT_READY`;
- claim `UI_GREEN`;
- claim `RUNTIME_GREEN`;
- claim full ESIP runtime readiness;
- deploy.

## EC-1 evidence

Required evidence:

- repository HEAD equals the reconciled GREEN baseline at entry;
- repository is clean at entry;
- actual existing Executive Card packages/services used by the authority map are present;
- authority contract JSON parses;
- human-readable authority contract exists;
- this gate ledger exists;
- only EC-1 governance artifacts are changed;
- no service/runtime/database/Docker files are changed.

## Current next boundary

After EC-1 artifacts are reviewed and accepted, the next controlled action remains within governance/evidence ordering:

1. resolve and materialize the current canonical 48-system BXSS registry and Executive Card capability-consumption authority;
2. validate full applicability with ESIP and current profile overlays;
3. do not install or wire runtime capability until that authority is proven;
4. then proceed to the authorized Phase 11B closure gate.

No later EC gate is opened by the existence of this ledger alone.
