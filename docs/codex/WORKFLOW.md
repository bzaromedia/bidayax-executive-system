# Codex Workflow

This repository uses an Executor -> specialized subagents -> Advisor workflow.

## Roles

- Executor
  - primary implementation agent
  - sole integration authority
  - owner of validation and final evidence
- Specialized subagents
  - bounded workers for discovery, implementation, testing, security, database, and documentation
- Advisor
  - highest model-based review authority
  - permanently read-only
  - issues `APPROVED`, `APPROVED_WITH_CONDITIONS`, or `REJECTED`

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

## Launch Procedure

### Executor

Requested target:

- model: `gpt-5.4`
- reasoning: `high`

Local status:

- `PASSED`: present in the local bundled model catalog
- `PASSED`: bundled catalog support includes `high`
- `BLOCKED`: live model-backed invocation was not validated during setup because tenant policy blocked the repository-scoped `codex exec` run
- `NOT RUN`: end-to-end custom-agent loading validation on this tenant surface

Repository-scoped model execution may transmit relevant repository context to the configured Codex service and is currently tenant-policy blocked in this environment.

Use this command when local policy permits a model-backed run:

```powershell
codex --cd D:\bidayax-executive-system --model gpt-5.4 -c model_reasoning_effort='"high"'
```

If the local surface rejects `gpt-5.4`, do not silently substitute another model. Record the limitation and either choose it manually in a supported surface or continue with an explicitly documented temporary deviation.

### Specialized Subagents

Subagents are defined in `.codex/agents/`. Ask the Executor to spawn them by name with explicit scope and ownership boundaries.

### Advisor

Requested review target:

```powershell
codex --cd D:\bidayax-executive-system --model gpt-5.6-sol -c model_reasoning_effort='"xhigh"'
```

Local status:

- `PASSED`: `gpt-5.6-sol` is present in the local bundled model catalog
- `PASSED`: bundled catalog support includes `xhigh`
- `PASSED`: the current session surface exposes `gpt-5.6-sol` with `xhigh`
- `BLOCKED`: repository-scoped live custom-agent validation remained blocked by tenant policy during setup

In the desktop app, use the model picker to select `GPT-5.6 Sol`, set reasoning to `Extra High`, and instruct Codex to operate as the `advisor` custom agent.

## Executor -> Advisor Cycle

1. Start the Executor in the repository root.
2. Ask it to inspect the repo, summarize active instruction files, and build a task graph.
3. Ask it to delegate independent scopes to named subagents from `.codex/agents/`.
4. Require Advisor Gate A before substantial high-risk implementation.
5. Require Advisor Gate B before executing or requesting approval for high-risk or irreversible actions.
6. Require Advisor Gate C after validation and before completion.
7. If the Advisor returns conditions or rejection, the Executor repairs the issues and repeats the relevant gate.