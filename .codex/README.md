# Codex Workflow Configuration

This directory defines the repository-scoped Codex workflow for The Executive Card.

## Purpose

- establish a durable Executor -> specialized subagents -> Advisor workflow;
- preserve repository-specific governance in a way Codex can load repeatedly;
- keep workflow guidance distinct from product/runtime agent systems described elsewhere in `docs/`.

## Verified Local Evidence On 2026-07-18

- `PASSED`: Standalone CLI version `codex-cli 0.145.0-alpha.18`
- `PASSED`: local bundled model catalog includes `gpt-5.4`, `gpt-5.6-sol`, and `gpt-5.6-terra`
- `PASSED`: bundled model catalog support for `gpt-5.4` includes `high`
- `PASSED`: current session surface exposes `gpt-5.6-sol` and `gpt-5.6-terra`
- `PASSED`: current session reasoning surface exposes `xhigh` for `gpt-5.6-sol`
- `PASSED`: Codex manual confirms `AGENTS.md`, `.codex/config.toml`, and `.codex/agents/*.toml` as supported project customization surfaces
- `BLOCKED`: repository-scoped live `codex exec` validation was denied by tenant policy because it would transmit repository instructions and workflow files to the configured Codex service
- `NOT RUN`: end-to-end runtime validation for project `[agents]` keys `max_threads`, `max_depth`, and `interrupt_message`
- `NOT RUN`: live custom-agent discovery through a repository-scoped model invocation on this tenant surface

## Requested Executor Target

- requested model: `gpt-5.4`
- requested reasoning: `high`
- status: catalog-verified locally; end-to-end invocation remains `BLOCKED` on this tenant surface

## Layout

- `config.toml`: project-scoped Codex defaults
- `agents/`: custom agent definitions
- `workflows/`: internal workflow operating rules

See [WORKFLOW.md](/D:/bidayax-executive-system/docs/codex/WORKFLOW.md) for the operating procedure and [MODEL-HIERARCHY.md](/D:/bidayax-executive-system/docs/codex/MODEL-HIERARCHY.md) for the requested-vs-verified model matrix.