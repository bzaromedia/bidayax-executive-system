# Preferred Model Policy

This policy selects preferred models for repository workflow roles. Governance
responsibilities remain model-independent and are defined in `WORKFLOW.md` and
root `AGENTS.md`.

## Executor

- preferred model: `gpt-5.5`
- preferred reasoning: `high`

If GPT-5.5 is unavailable within the current Codex runtime, the Executor shall
use the currently supported production implementation model until GPT-5.5
becomes available. Record the fallback and its runtime evidence in the task's
final evidence report; do not permanently repin the Executor role to it.

## Advisor

- preferred model: `gpt-5.6-sol` (GPT-5.6 Sol)
- preferred reasoning: `xhigh` (Extra High)

The Advisor configuration remains in `.codex/agents/advisor.toml`. It is
read-only and is never a repository-writing role.