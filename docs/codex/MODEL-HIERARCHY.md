# Model Hierarchy

## Requested Hierarchy

- Executor
  - requested model: `gpt-5.4`
  - requested reasoning: `high`
- Advisor
  - requested model: `gpt-5.6-sol`
  - requested reasoning: `xhigh`

## Verified Local Evidence On 2026-07-18

- `PASSED`: Standalone CLI version `codex-cli 0.145.0-alpha.18`
- `PASSED`: local bundled model catalog contains `gpt-5.4`, `gpt-5.6-sol`, and `gpt-5.6-terra`
- `PASSED`: bundled catalog support for `gpt-5.4` includes `high`
- `PASSED`: current user config default is `gpt-5.6-sol` with `medium`
- `PASSED`: current session callable model surface includes `gpt-5.6-sol` and `gpt-5.6-terra`
- `PASSED`: current session callable reasoning surface for `gpt-5.6-sol` includes `xhigh`
- `PASSED`: repository agent configuration declares the Advisor target in `.codex/agents/advisor.toml`
- `BLOCKED`: repository-scoped live model execution for Executor and Advisor validation on this tenant surface
- `NOT RUN`: end-to-end custom-agent loading validation through a safe repository-scoped invocation
- `NOT RUN`: runtime effect validation for project `[agents]` keys in `.codex/config.toml`

## Availability Decision

- Advisor target: declared in repository configuration and catalog/session-surface-verified for model availability; end-to-end custom-agent execution remains `BLOCKED`
- Executor target: catalog-verified locally, but end-to-end execution remains `BLOCKED` on this Codex surface during setup

The workflow preserves the requested Executor hierarchy but does not claim GPT-5.4 High is active until policy permits a live model-backed validation run on this surface.

## Supported Alternatives Observed During Setup

- `gpt-5.6-sol`
- `gpt-5.6-terra`

No permanent substitute for the Executor was pinned automatically.