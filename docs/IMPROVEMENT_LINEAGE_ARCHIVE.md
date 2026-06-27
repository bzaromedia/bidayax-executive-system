# Improvement Lineage Archive

## Status

This document originally defined the future archive model. Phase 13 now implements the first database-backed lineage table, `improvement_lineage_archive`, while still avoiding automation, code mutation, and production deployment.

## Purpose

The Improvement Lineage Archive is the permanent memory of the future BidayaX Evolutionary Improvement Engine (TM). It records every proposed improvement, every variant, every benchmark, every critique, every safety review, every decision, and every rollback requirement.

## Phase 13 Implemented Table

`improvement_lineage_archive` stores:

- candidate reference
- parent candidate reference
- variant id
- target area
- hypothesis
- design and code diff summaries
- metrics before
- metrics after, kept null in Phase 13
- test results, kept null in Phase 13
- benchmark results, kept null in Phase 13
- review notes
- risk score
- approval status
- rollback plan

Phase 13 does not fake `metrics_after`, `test_results`, or `benchmark_results`.

The archive prevents the system from pretending that only successful ideas existed. Failed, unsafe, inconclusive, and superseded variants are valuable evidence.

## Archive Principles

- Record every proposed improvement.
- Preserve rejected and failed variants.
- Link every variant to its parent proposal.
- Store evidence separately from opinion.
- Store approval separately from automated recommendation.
- Require rollback plans for accepted changes.
- Keep production release authority human-controlled.
- Make decisions auditable and reproducible.
- Never copy or store proprietary external prompts, code, APIs, branding, or private methods.

## Improvement Record

Each future improvement should have one archive record.

Conceptual fields:

- Improvement ID.
- Title.
- Domain.
- Triggering signal.
- Date opened.
- Requesting human or system source.
- Conductor Agent owner.
- Current baseline.
- Improvement hypothesis.
- Target metrics.
- Risk classification.
- Related source-of-truth docs.
- Related events, incidents, or feedback.
- Current status.

## Variant Record

Each improvement can have multiple variants.

Conceptual fields:

- Variant ID.
- Parent improvement ID.
- Parent variant ID when derived from another variant.
- Variant summary.
- Proposed change.
- Sandbox environment.
- Files or artifacts touched in sandbox.
- Expected metric movement.
- Known risks.
- Rollback plan.
- Status.

## Evidence Record

Evidence must be stored independently from recommendations.

Conceptual fields:

- Evidence ID.
- Variant ID.
- Evidence type.
- Collection method.
- Baseline value.
- Variant value.
- Metric delta.
- Confidence level.
- Reproducibility notes.
- Limitations.
- Raw artifact reference.
- Reviewer notes.

Evidence types may include:

- Unit test result.
- Integration test result.
- Storybook review.
- Accessibility check.
- Performance benchmark.
- Conversion metric.
- Intent scoring fixture result.
- Receptionist workflow simulation.
- Security review.
- Documentation review.
- Human qualitative review.

## Critique Record

Critiques should be preserved even when a variant is accepted.

Conceptual fields:

- Critique ID.
- Variant ID.
- Critique Agent version.
- Main objections.
- Unsupported claims.
- Alternative explanations.
- Maintainability concerns.
- Design governance concerns.
- Required revisions.
- Open questions.

## Safety Record

Safety review must be explicit for any change that touches data, automation, scoring, receptionist workflows, security, or production deployment.

Conceptual fields:

- Safety review ID.
- Variant ID.
- Risk class.
- Privacy concerns.
- Security concerns.
- Accessibility concerns.
- Production permission concerns.
- Human approval requirements.
- Required mitigations.
- Blocked status.
- Reviewer notes.

## Decision Record

The archive must distinguish automated recommendation from human approval.

Conceptual fields:

- Decision ID.
- Improvement ID.
- Selected variant ID if any.
- Automated recommendation.
- Human decision.
- Decision date.
- Approver.
- Evidence reviewed.
- Reasons for approval or rejection.
- Release conditions.
- Rollback owner.
- Monitoring requirements.

Decision states:

- Proposed.
- In sandbox.
- Needs evidence.
- Needs revision.
- Rejected.
- Archived for later.
- Approved for human review.
- Human approved.
- Released.
- Rolled back.
- Superseded.

## Rollback Record

Every accepted change must have rollback details before release.

Conceptual fields:

- Rollback ID.
- Decision ID.
- Release artifact.
- Rollback trigger.
- Rollback steps.
- Data recovery notes.
- Owner.
- Maximum acceptable recovery time.
- Verification steps after rollback.
- Post-rollback review status.

## Evidence-Weighted Selection Record

The archive should preserve how variants were compared.

Comparison dimensions:

- Target metric improvement.
- Test pass rate.
- Accessibility impact.
- Performance impact.
- Security risk.
- Privacy risk.
- Design-system governance fit.
- Maintainability.
- Rollback simplicity.
- User value.
- Thesis alignment.

The selected variant must show why it beat alternatives. If a human chooses a lower-scoring variant, the archive must record the reason.

## Domain Metrics

### Design Tokens

Possible metrics:

- Contrast pass rate.
- Token reuse rate.
- Raw value reduction.
- Theme consistency.
- Component coverage.

### UI Components

Possible metrics:

- Accessibility pass rate.
- Reuse count.
- Bundle impact.
- Prop complexity.
- Storybook coverage.

### Accessibility

Possible metrics:

- Keyboard completion rate.
- Focus visibility.
- Label coverage.
- Reduced-motion compliance.
- Contrast pass rate.

### Performance

Possible metrics:

- Load time.
- Interaction latency.
- Bundle size.
- Render count.
- API response time.

### QR Conversion

Possible metrics:

- Scan-to-contact conversion.
- Form completion rate.
- Contact save rate.
- Follow-up initiation rate.
- Attribution completeness.

### Receptionist Workflows

Possible metrics:

- Missed-call recovery rate.
- Routing accuracy.
- Escalation accuracy.
- Meeting booking rate.
- Human correction rate.

### Intent Scoring

Possible metrics:

- Human agreement rate.
- False positive rate.
- False negative rate.
- Explanation completeness.
- Calibration drift.

### Dashboard Insights

Possible metrics:

- Insight action rate.
- Time to decision.
- Explanation usefulness.
- Overdue follow-up reduction.
- Executive priority precision.

### Documentation Quality

Possible metrics:

- Source-of-truth coverage.
- Broken link count.
- Acceptance criteria completeness.
- Contradiction count.
- Review readiness score.

### Security Posture

Possible metrics:

- Unresolved findings.
- Secret exposure count.
- Audit coverage.
- Permission drift.
- Security regression count.

## Retention And Auditability

Future archive records should be retained long enough to support:

- Architectural review.
- Security review.
- Model and scoring audit.
- Product decision history.
- Rollback analysis.
- Compliance review where applicable.

Records should not contain unnecessary personal data. Sensitive references should point to governed storage instead of duplicating private content.

## Non-Implementation Note

This document is a conceptual archive model only. It creates no tables, migrations, schemas, services, files beyond documentation, or automated archive process.
