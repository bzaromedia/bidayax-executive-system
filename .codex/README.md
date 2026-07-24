# Codex Workflow Configuration

This directory defines the repository-scoped Codex workflow for The Executive Card.

## Purpose

- establish a durable Executor -> specialized subagents -> Advisor workflow;
- preserve repository-specific governance in a way Codex can load repeatedly;
- keep workflow guidance distinct from product/runtime agent systems described elsewhere in `docs/`.

## Model Policy

Preferred models are maintained separately from role responsibilities in
`docs/codex/MODEL-HIERARCHY.md`. The policy defines a documented Executor
fallback when its preferred model is unavailable; it does not permanently pin a
fallback model in this configuration.

## Layout

- `config.toml`: project-scoped Codex defaults
- `agents/`: custom agent definitions
- `workflows/`: internal workflow operating rules

See [WORKFLOW.md](/D:/bidayax-executive-system/docs/codex/WORKFLOW.md) for the operating procedure and [MODEL-HIERARCHY.md](/D:/bidayax-executive-system/docs/codex/MODEL-HIERARCHY.md) for the current preferred-model policy.