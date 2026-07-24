# Codex Workflow

This repository uses an Executor -> specialized subagents -> Advisor workflow.

## Roles

- Executor
  - primary implementation agent
  - sole integration authority
  - owner of validation and final evidence
  - performs implementation, coding, repository edits, builds, tests,
    validation, remediation, and documentation updates
  - creates commits only after Advisor approval
- Specialized subagents
  - bounded workers for discovery, implementation, testing, security, database, and documentation
- Advisor
  - highest model-based review authority
  - permanently read-only
  - performs architecture, design, repository-governance, implementation,
    validation, and security review
  - provides final approval before a commit
  - issues `APPROVED`, `APPROVED_WITH_CONDITIONS`, or `REJECTED`

The Executor may never self-approve. The Advisor may never modify repository
files. Role responsibilities are independent of the preferred-model policy,
which is maintained separately in `MODEL-HIERARCHY.md`.

## Operating Loop

1. Inspect repository state and governing docs.
2. Build a dependency-aware task graph.
3. Separate parallel-safe work from sequential work.
4. Delegate bounded scopes with non-overlapping write ownership.
5. Integrate accepted results into the main working tree.
6. Run focused validation, then broader validation as required.
7. Invoke Advisor review gates.
8. Repair any rejected or conditional findings.
9. Produce the final evidence report.

## Operational Use

### Specialized Subagents

Subagents are defined in `.codex/agents/`. Ask the Executor to spawn them by name with explicit scope and ownership boundaries.

## Executor -> Advisor Cycle

1. Start the Executor in the repository root.
2. Ask it to inspect the repo, summarize active instruction files, and build a task graph.
3. Ask it to delegate independent scopes to named subagents from `.codex/agents/`.
4. Require Advisor Gate A before substantial high-risk implementation.
5. Require Advisor Gate B before executing or requesting approval for high-risk or irreversible actions.
6. Require Advisor Gate C after validation and before completion.
7. If the Advisor returns conditions or rejection, the Executor repairs the issues and repeats the relevant gate.
8. Do not commit until the Advisor returns `APPROVED`.