# BidayaX Codex Operating Contract

This file governs Codex work inside `D:\bidayax-executive-system`.

It applies to repository development workflow only. It does not create product runtime agents, autonomous production workflows, deployment authority, or new application behavior.

## Repository Mission And Boundaries

- Mission: maintain and extend The Executive Card as a truthful Executive Identity Intelligence Platform owned by BidayaX LLC.
- Current release boundary: implemented, tested, production-buildable v1.0 foundations only.
- Do not present deferred enterprise, commercialization, certification, or future autonomous-agent phases as implemented.
- Production telephony, production voice, and production calling remain disabled unless higher-authority instructions and repository evidence explicitly say otherwise.

## Source Of Truth

Follow this authority order:

1. Latest explicit user instruction.
2. Repository governance and approved specifications in `docs/` and `agents/`.
3. Existing contracts, schemas, migrations, APIs, and acceptance criteria.
4. Executable validation evidence: builds, type checks, linters, tests, migrations, and runtime checks.
5. Verified official documentation.
6. Advisor judgment.
7. Executor judgment.
8. Specialized subagent recommendations.

If a lower source conflicts with a higher one, stop and report the conflict.

## Required Reading Before Substantial Changes

Read these before substantial implementation, refactoring, review, or release work:

- `README.md`
- `docs/SYSTEM_THESIS.md`
- `docs/ENGINEERING_METHODOLOGY.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_MODEL.md`
- `docs/ACCEPTANCE_TESTS.md`
- `agents/AGENTS.md`
- `agents/codex-rules.md`
- `agents/review-checklist.md`

Read task-specific documents before editing related areas. Examples:

- Trust and cryptography: `docs/TRUST_ARCHITECTURE.md`, `docs/TRUST_DATABASE.md`, `docs/TRUST_TESTING.md`, `docs/TRUST_ROLLBACK.md`
- Telephony and voice safety: `docs/VOICE_RUNTIME_SAFETY.md`, `docs/PRODUCTION_VOICE_SAFETY_GATE.md`, `docs/TELEPHONY_SECURITY.md`
- Settings and persistence: `docs/SETTINGS_PERSISTENCE_LAYER.md`, `docs/SETTINGS_PERSISTENCE_SECURITY.md`, `docs/SETTINGS_ACCEPTANCE_TESTS.md`

## Source-Of-Truth Directories And Files

- `docs/`: product, architecture, security, operations, rollout, and acceptance documents
- `database/migrations/`: schema source of truth
- `packages/types/`: shared contract shapes
- `.github/workflows/ci.yml`: baseline CI verification path
- `package.json`: package manager and repository validation entry points
- `agents/`: preserved repository operational guidance
- `.codex/`: Codex workflow configuration and supporting instructions

## Approved Commands And Package Manager

- Package manager: `pnpm@11.7.0`
- Node runtime target: Node 22
- Primary validation commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm db:migrations:verify`
  - `pnpm verify:design-governance`
  - `pnpm verify:public-claims`
  - `pnpm verify:production`
  - `pnpm verify:no-placeholders`
  - `pnpm verify:release-scope`
  - `pnpm verify:no-missing-workspaces`
  - `pnpm test:settings-persistence:postgres`
- CI baseline in GitHub Actions currently runs:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:migrations:verify`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

Prefer `rg`/`rg --files` for search.

## Architecture Rules

- Preserve the Identity-to-Intelligence Architecture.
- Keep event-first capture, explainable scoring, durable evidence, and truthful dashboard behavior intact.
- Prefer the smallest complete vertical slice over speculative framework work.
- Do not invent architecture layers that are not justified by repository evidence.
- Route UI changes through governed design-system packages and docs.
- Keep production-disabled voice and telephony claims accurate.

## Coding Conventions

- Match existing TypeScript, React, Next.js, Vitest, PostgreSQL, and pnpm workspace patterns.
- Prefer direct, readable domain logic over abstraction.
- Add dependencies only with explicit justification and scope.
- Preserve tenant isolation, idempotency, immutability, and append-only guarantees where present.
- Keep comments sparse and high signal.

## Security Requirements

- Never expose secrets, credentials, private keys, tokens, or raw sensitive evidence in code, prompts, logs, or reports.
- Fail closed on authorization, environment, provider, and policy uncertainty.
- Preserve truthful public claims; do not add fake integrations, placeholder behavior, or misleading readiness states.
- Do not activate production providers, production calling, production voice, production telephony, deployment flows, or irreversible operations without explicit user approval and repository evidence.

## Testing Requirements

- Run validation proportional to risk.
- Do not claim a check passed unless it actually ran and passed.
- Report every result as `PASSED`, `FAILED`, `NOT RUN`, `NOT APPLICABLE`, or `BLOCKED`.
- For schema, auth, tenant-isolation, trust, or security changes, require focused tests plus broader validation.

## Documentation Requirements

- Update source-of-truth docs when behavior, architecture, operations, security posture, or limits change.
- Keep `.codex/` workflow docs aligned with actual local Codex capabilities.
- Record material workflow decisions in `docs/codex/DECISION-LOG.md`.

## Prohibited Behaviors

- No destructive Git commands without explicit authorization.
- No silent model substitution for pinned workflows.
- No fabricated results, tests, logs, approvals, or review outcomes.
- No overlapping subagent write scopes.
- No commit amend, push, merge, deploy, publish, migration rollout, or dependency upgrade without explicit user authorization.
- No product/runtime agent claims derived from this repository workflow setup.

## Executor Authority

The Executor is the single integration authority. The Executor alone may:

- own the master plan;
- allocate scopes;
- assign write ownership;
- integrate changes into the primary working tree;
- reconcile conflicting recommendations;
- decide which validation is complete;
- prepare the final evidence report.

## Advisor Review Authority

- The Advisor is the highest model-based review authority.
- The Advisor is read-only by default.
- The Advisor must challenge assumptions against repository evidence.
- Advisor verdicts at required gates are `APPROVED`, `APPROVED_WITH_CONDITIONS`, or `REJECTED`.
- `REJECTED` blocks completion.
- `APPROVED_WITH_CONDITIONS` blocks completion until mandatory conditions are resolved or explicitly accepted by the user.

## Subagent Delegation Rules

- Delegate only genuinely independent work.
- Give each subagent:
  - objective;
  - exact scope;
  - allowed files or directories;
  - prohibited files or directories;
  - read-only or write-enabled status;
  - governing requirements;
  - required commands;
  - required evidence;
  - output format;
  - stopping conditions.
- Prefer read-only subagents for exploration and review.
- Do not allow overlapping file-write ownership.
- Subagent conclusions are advisory until accepted by the Executor.

## Evidence Requirements

Every substantial task must leave:

- starting repository state;
- governing requirements used;
- files changed;
- commands run;
- validation status per command;
- unresolved risks;
- final repository state.

## Completion Criteria

Work is complete only when:

1. requested behavior is implemented or accurately documented;
2. acceptance criteria trace to evidence;
3. required validation is complete;
4. critical and major findings are resolved or explicitly escalated;
5. docs reflect reality;
6. no hidden failures, fake integrations, or misleading claims remain;
7. final Git state is reported accurately.

## Escalation Rules

- Escalate when higher-authority sources conflict.
- Escalate when user choice is required for product, legal, business, deployment, or irreversible outcomes.
- Escalate when exact model availability cannot be verified locally and a requested pinned workflow depends on it.

## Nested Guidance

- Inspect more deeply nested `AGENTS.md` or `AGENTS.override.md` files when present in the working subtree.
- Because this repository already keeps operational guidance under `agents/`, treat `agents/AGENTS.md`, `agents/codex-rules.md`, and `agents/review-checklist.md` as preserved companion governance even when editing outside that directory.
