# Decision Log

## 2026-07-18 - Root Codex Workflow Added

- Decision: add a root `AGENTS.md`, project `.codex/` workflow config, and `docs/codex/` documentation.
- Reason: the repository already had `agents/` guidance, but Codex instruction discovery is rooted in top-level `AGENTS.md` and `.codex/`.
- Evidence:
  - repository already contained `agents/AGENTS.md`
  - repository did not contain a root `AGENTS.md`
  - Codex manual confirms repo-level `AGENTS.md` and `.codex/config.toml` are the supported local guidance surfaces

## 2026-07-18 - Advisor Declared, Executor Left Unpinned

- Decision: declare the Advisor target as `gpt-5.6-sol` with `xhigh`, but do not pin the Executor to `gpt-5.4` in project config.
- Reason: `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.4` were present in the local bundled model catalog, but a live repository-scoped validation run for `gpt-5.4` was blocked by tenant policy during setup.
- Evidence:
  - current user config uses `gpt-5.6-sol`
  - current session callable model surface exposed `gpt-5.6-sol` and `gpt-5.6-terra`
  - local bundled model catalog included `gpt-5.4` with `high` reasoning support
  - tenant policy blocked the repository-scoped live `codex exec` validation run

## 2026-07-18 - Workflow Authority And Evidence Tightened

- Decision: keep the Advisor permanently read-only, prohibit subagents from external or irreversible actions, and label workflow capability evidence with explicit repository status terms.
- Reason: repository governance requires explicit user authorization for push, merge, deploy, and similar actions, while workflow evidence must distinguish `PASSED`, `BLOCKED`, and `NOT RUN` states.
- Evidence:
  - root `AGENTS.md` requires explicit user authorization for commit amend, push, merge, deploy, publish, migration rollout, and dependency upgrade
  - security review identified approval-laundering risk in subagent wording
  - documentation review identified overstatement risk around “pinned” and custom-agent/runtime validation claims

## 2026-07-18 - Workflow Kept Separate From Product Agent Documents

- Decision: keep this Codex workflow explicitly separate from product/runtime agent architecture.
- Reason: repository docs already state that future specialist-agent and evolutionary-agent systems are documentation only and not active runtime behavior.
- Evidence:
  - `docs/FUTURE_SPECIALIST_AGENT_COLLECTIVE.md`
  - `docs/EVOLUTIONARY_AGENT_SYSTEM.md`

## 2026-07-24 - Preferred Executor And Advisor Policy Updated

- Decision: update active Codex workflow policy to prefer a role-based Executor
  target of `gpt-5.5` with high reasoning and a read-only Advisor target of
  `gpt-5.6-sol` with extra-high reasoning.
- Reason: the current PR #11 remediation instruction requires a role-based
  policy that records runtime fallbacks without permanently repinning the
  Executor role when a preferred model is unavailable.
- Evidence:
  - root `AGENTS.md` now states the Executor may not self-approve and commit
    authority follows required Advisor approval
  - `docs/codex/MODEL-HIERARCHY.md`
  - `docs/codex/WORKFLOW.md`
  - `.codex/README.md`
  - `.codex/config.toml`
