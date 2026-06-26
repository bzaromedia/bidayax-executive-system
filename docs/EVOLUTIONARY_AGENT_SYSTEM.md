# Evolutionary Agent System

## Status

This document defines a future agent architecture only. It does not create agents, prompts, workflows, tools, services, queues, or automation.

## Purpose

The future BidayaX Evolutionary Agent System is the agent topology for the BidayaX Evolutionary Improvement Engine (TM). Its purpose is to coordinate safe, evidence-backed improvement proposals while preserving human control over production.

## Design Principles

- Agents propose and evaluate; humans approve production release.
- Every proposal must be archived.
- Every accepted change must be reversible.
- Every variant must be evaluated in a sandbox first.
- Every claim must be tied to evidence or marked as hypothesis.
- No agent may directly deploy to production.
- No agent may rewrite its own authority, permissions, or approval rules.
- No agent may copy proprietary methods from another company.

## Agent Topology

```text
Human Owner
-> Conductor Agent
   -> Research Agent
   -> Implementation Agent
   -> Verification Agent
   -> Critique Agent
   -> Safety Agent
   -> Benchmarking Agent
   -> Archiving Agent
-> Human Approval
-> Controlled Release
```

## Conductor Agent

The Conductor Agent coordinates improvement work. It does not deploy to production.

Responsibilities:

- Receive improvement signals.
- Create improvement briefs.
- Assign work to specialists.
- Enforce sandbox-first evaluation.
- Require lineage archive entries.
- Compare evidence across variants.
- Escalate uncertainty to humans.
- Block changes that lack rollback plans.
- Prepare human approval packets.

Required outputs:

- Improvement brief.
- Specialist assignment list.
- Evidence summary.
- Variant ranking.
- Approval recommendation.
- Release risk summary.

## Specialist Agents

### Research Agent

Purpose: gather public, internal, and project-approved evidence.

Responsibilities:

- Review source-of-truth docs.
- Summarize relevant public research.
- Identify prior BidayaX decisions.
- Identify known risks and adjacent failures.
- Distinguish public inspiration from proprietary material.

Outputs:

- Research memo.
- Source list.
- Hypothesis options.
- Known constraints.

### Implementation Agent

Purpose: create sandbox-only candidate variants in a future implementation phase.

Responsibilities:

- Produce candidate changes in isolated environments.
- Keep variants small.
- Preserve existing architecture boundaries.
- Avoid production credentials and production data.
- Produce rollback notes.

Outputs:

- Variant artifact.
- Change summary.
- Rollback proposal.
- Known tradeoffs.

Restriction: this agent does not exist in Phase 1 or Phase 2 documentation work and must not be created until a later approved phase.

### Verification Agent

Purpose: verify that a variant works as claimed.

Responsibilities:

- Run tests.
- Check acceptance criteria.
- Validate event, scoring, design, or workflow behavior.
- Confirm no unintended scope expansion.
- Record failures without deleting them.

Outputs:

- Verification report.
- Test evidence.
- Regression list.
- Pass/fail judgment.

### Critique Agent

Purpose: challenge weak reasoning and prevent premature approval.

Responsibilities:

- Identify unsupported claims.
- Compare variants against alternatives.
- Check whether metrics are meaningful.
- Find maintainability risks.
- Detect design drift, abstraction creep, and category drift.

Outputs:

- Critique memo.
- Open questions.
- Variant objections.
- Required revisions.

### Safety Agent

Purpose: protect security, privacy, governance, and human control.

Responsibilities:

- Review access boundaries.
- Check data privacy risk.
- Check production permission risk.
- Review human approval requirements.
- Block unsafe autonomous behavior.
- Require rollback and auditability.

Outputs:

- Safety review.
- Risk classification.
- Required mitigations.
- Blocker list.

### Benchmarking Agent

Purpose: measure variant performance against defined criteria.

Responsibilities:

- Define benchmark fixtures.
- Run repeatable measurements.
- Compare baseline and variant.
- Report confidence and uncertainty.
- Detect metric gaming.

Outputs:

- Benchmark report.
- Baseline comparison.
- Confidence level.
- Measurement limitations.

### Archiving Agent

Purpose: preserve lineage for every proposal and outcome.

Responsibilities:

- Create lineage records.
- Link variants to parent proposals.
- Store evidence, critiques, safety reviews, and approvals.
- Mark rejected and superseded work without deleting it.
- Preserve rollback records for accepted changes.

Outputs:

- Lineage archive entry.
- Variant relationship map.
- Decision record.
- Audit summary.

## Improvement Work Packet

Every future improvement packet should contain:

- Improvement ID.
- Domain.
- Triggering signal.
- Current baseline.
- Proposed variants.
- Assigned specialists.
- Sandbox plan.
- Metrics plan.
- Safety considerations.
- Approval requirements.
- Rollback requirements.

## Sandbox-First Model

Agents may only evaluate proposed changes in controlled environments:

- Local workspace.
- Ephemeral branch.
- Preview environment.
- Synthetic fixture.
- Non-production dataset.
- Storybook review surface.
- Benchmark harness.

Production data and production deployment require explicit human authorization and must never be assumed.

## Human Approval Packet

Before any release, the Conductor Agent must prepare:

- What changed.
- Why the change is proposed.
- Which variants were considered.
- What evidence supports the selected variant.
- What failed.
- What risks remain.
- What rollback plan exists.
- Which metrics must be monitored after release.

## Domain-Specific Agent Use

### Design Tokens

Research Agent compares token needs against design governance. Benchmarking Agent checks contrast and usage coverage. Safety Agent checks brand and accessibility risk.

### UI Components

Implementation Agent may later create sandbox variants. Verification Agent checks behavior and accessibility. Critique Agent checks unnecessary abstraction.

### Accessibility

Benchmarking Agent runs contrast, keyboard, reduced-motion, and semantic checks. Safety Agent treats severe accessibility regressions as release blockers.

### Performance

Benchmarking Agent compares baseline and variant. Critique Agent challenges whether the change improves a user-visible workflow.

### QR Conversion

Research Agent frames conversion hypotheses. Safety Agent checks privacy and consent. Benchmarking Agent measures scan-to-contact and follow-up outcomes.

### Receptionist Workflows

Safety Agent reviews escalation, consent, sensitive topics, and human handoff. Verification Agent checks transcripts, summaries, and routing outcomes in sandbox.

### Intent Scoring

Benchmarking Agent compares fixture accuracy. Critique Agent checks false positives and false negatives. Safety Agent blocks unexplained production scoring changes.

### Dashboard Insights

Critique Agent checks whether insights are actionable. Benchmarking Agent compares relevance, latency, and explanation quality.

### Documentation Quality

Research Agent finds contradictions. Critique Agent checks clarity. Archiving Agent links doc changes to decisions.

### Security Posture

Safety Agent leads. Verification Agent checks controls. Human approval is mandatory for any security-sensitive production change.

## Prohibited Agent Behavior

- Deploying directly to production.
- Changing its own permission model.
- Deleting lineage records.
- Hiding failed variants.
- Using production secrets in sandbox work.
- Copying proprietary APIs, code, prompts, or internal methods.
- Generating application screens before design-system gates.
- Changing scoring, receptionist, or security behavior without human approval.

## Non-Implementation Note

This document defines future roles and governance only. No agents, prompts, task runners, queues, tool calls, or automation workflows are created here.
