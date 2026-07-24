# Phase Gate Policy

Status: Active governance

## Entry Gate

Before implementation begins, a phase must have:

- accepted ADR coverage for the phase architecture;
- explicit scope and non-goals;
- acceptance criteria;
- test and validation plan;
- rollback strategy;
- security, privacy, reliability, and observability requirements;
- owner-approved implementation plan.

## Implementation Gate

Implementation work must map to the active phase, an accepted ADR, and explicit
acceptance criteria. Work discovered for a future phase must be recorded in the
deferred roadmap or phase plan and not implemented early.

## Validation Gate

Applicable validation includes dependency integrity, formatting, typecheck,
lint, unit tests, integration tests, end-to-end tests, database-backed tests,
security tests, authorization tests, accessibility validation, performance
validation, build, repository verification, documentation review, secret
scanning, Advisor review, and CI verification.

Skipped checks require an accepted, documented exception. Silent waivers are not
allowed.

## Closure Gate

A phase is complete only when its closure record is accepted and merged. The
closure record must identify ADRs satisfied, scope delivered, acceptance
criteria results, validation evidence, security review, Advisor disposition,
remaining risks, deferred work, merge references, production status, and the
formal phase-completion decision.

The next phase may not enter implementation until the prior phase has passed
this closure gate.
