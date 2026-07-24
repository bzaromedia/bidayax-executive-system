# Architecture Decision Records

Status: Active ADR governance

This directory contains durable architecture decision records for The Executive
Card(TM). ADRs are separate from implementation plans and phase closure records.

## Numbering

- ADR numbers are four digits, starting at `0001`.
- New ADRs use the next unused number.
- Do not renumber accepted ADRs.
- Do not create duplicate ADRs for a decision already covered by an accepted
  ADR. Create a supplementary or superseding ADR only when the existing record
  does not cover the new decision.

## Status Vocabulary

- `Proposed`: drafted for review; not implementation authority.
- `Accepted`: approved and active; implementation may proceed within scope.
- `Superseded`: replaced by a later accepted ADR.
- `Amended`: changed through the explicit amendment mechanism below.
- `Rejected`: reviewed and not accepted.

## Immutability

Accepted ADRs are historical records. Do not silently rewrite accepted decision
history. Corrections must use one of:

- a superseding ADR;
- an amendment section appended to the accepted ADR;
- a repository-approved correction that preserves the original decision text.

## Ownership

Each ADR must identify owners, affected phase, related documents, and completion
evidence requirements. The owner of the active phase is responsible for keeping
the ADR linked to implementation and closure evidence.

## Required Phase ADR Sections

Use `docs/adr/ADR-TEMPLATE.md`. Every major remaining phase requires accepted
ADR coverage before implementation.

## Index

| ADR | Title | Status | Phase |
| --- | --- | --- | --- |
| `0001` | Communications Completion Boundary | Proposed | Phase 11 |
