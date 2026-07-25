# Phase Gate Policy

Status: Active governance

## Entry Gate

This policy applies to active production roadmap milestones and subphases after
the policy is accepted and merged. It does not retroactively reopen completed
historical v1.0 phase records.

Before implementation begins, a phase or subphase must have:

- accepted ADR coverage for the phase architecture;
- explicit scope and non-goals;
- acceptance criteria;
- test and validation plan;
- rollback strategy;
- security, privacy, reliability, and observability requirements;
- owner-approved implementation plan.

## Implementation Gate

Implementation work must map to the active phase, the active subphase, an
accepted ADR, and explicit acceptance criteria. Work discovered for a future
phase or subphase must be recorded in the deferred roadmap or phase plan and
not implemented early.

Within Phase 11, subphases 11A through 11I are linear. A successor subphase may
not enter implementation until its predecessor has an accepted and merged
closure record.

## Validation Gate

Applicable validation includes dependency integrity, formatting, typecheck,
lint, unit tests, integration tests, end-to-end tests, database-backed tests,
security tests, authorization tests, accessibility validation, performance
validation, build, repository verification, documentation review, secret
scanning, Advisor review, and CI verification.

Skipped checks require an accepted, documented exception. Silent waivers are not
allowed.

## Review And Merge Gate

Before merge, the active phase or subphase package must have:

- clean working tree evidence;
- passing local validation proportional to risk;
- passing required remote CI;
- no unresolved review threads or requested changes;
- read-only Advisor approval when required by repository governance.

Merge does not itself close the phase or subphase unless the merged artifact is
the accepted closure record.

## Closure Gate

A phase or subphase is complete only when its closure record is accepted and
merged. The closure record must identify ADRs satisfied, scope delivered,
acceptance criteria results, validation evidence, security review, Advisor
disposition, remaining risks, deferred work, merge references, production
status, and the formal completion decision.

The next subphase may not enter implementation until the prior subphase has
passed this closure gate. The next phase may not enter implementation until the
prior phase and all of its governed subphases have passed their closure gates.

## Production Authorization Gate

Production authorization requires a merged activation record approved by the
BidayaX LLC owner or an explicitly named production delegate. The record must
identify approver, environment, provider, exact actions, scope, expiry,
rollback evidence, and validation evidence.

Before that record is merged, SSH, VPS, hosting-control-panel access,
production-data access, provider-console or provider-API access, credential
retrieval or provisioning, provider enablement, deployment, and live execution
are prohibited.
