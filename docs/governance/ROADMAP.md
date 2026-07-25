# Canonical Linear Roadmap

Status: Active governance
Owner: BidayaX LLC

This roadmap controls production milestone ordering. It does not by itself
authorize implementation. Each major phase requires accepted ADR coverage before
implementation and a closure record before the next phase begins.

## Governance Adoption Boundary

This active production roadmap applies from the date it is accepted and merged.
It does not erase, reopen, or renumber completed historical v1.0 recovery
records in `docs/PHASE_STATUS.md`.

Historical v1.0 records and active production roadmap records are separate
tracks. When they use the same numeric label, use the document scope and date to
determine which track is being discussed.

## Numbering Rule

Pull request numbers and project phase numbers are independent. PR #11 merged
production-reconciliation tooling; it does not prove that project Phase 11 is
complete.

## Active Phase 11 Subphase Sequence

Phase 11 Communications Completion is governed internally by these linear
subphases:

| Subphase | Name | Current disposition |
| --- | --- | --- |
| 11A | Architecture and governance | Closure evidence package proposed; 11B remains locked until accepted and merged. |
| 11B | Data model | Locked until 11A closure. |
| 11C | Orchestration runtime | Locked until 11B closure. |
| 11D | Telephony adapter | Locked until 11C closure. |
| 11E | Receptionist runtime | Locked until 11D closure. |
| 11F | Security, consent, and trust | Locked until 11E closure. |
| 11G | Observability and operations | Locked until 11F closure. |
| 11H | Staging validation | Locked until 11G closure. |
| 11I | Communications production activation | Locked until 11H closure and a merged activation record. |

## Locked Sequence

| Phase | Name | Current disposition |
| --- | --- | --- |
| 11 | Communications Completion | Active; incomplete. See `docs/governance/CURRENT_PHASE_STATUS.md` and `docs/phase-11/GAP_ANALYSIS.md`. |
| 12 | Production Stabilization | Locked for future planning only after Phase 11 closes. |
| 13 | Production Infrastructure | Locked. |
| 14 | Platform Production Activation | Locked; this is the broader platform activation milestone and does not replace the Phase 11I communications activation gate. |
| 15 | Investor Readiness | Locked. |
| 16 | Revenue Operations | Locked. |
| 17 | Production Scale | Locked. |
| 18 | Version 2 Planning | Locked; Version 2 implementation remains prohibited. |

## Historical Phase Records

`docs/PHASE_STATUS.md` preserves earlier v1.0 recovery and hardening phase
records, including historical Phase 11 Production Hardening and historical
Phase 12 Observability. Those historical records remain accepted evidence in
their own track, but they do not close the current Phase 11 Communications
Completion sequence defined under `docs/phase-11/`.

When numeric labels overlap, preserve both records in their own tracks and use
the document scope and date to determine which roadmap is being discussed.
