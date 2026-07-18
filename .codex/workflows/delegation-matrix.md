# Delegation Matrix

Use these agents for bounded scopes:

- `codebase-explorer`
  - discovery, path finding, symbol mapping, command discovery
  - default mode: read-only
- `architect`
  - boundaries, interfaces, decomposition, future-proofing
  - default mode: read-only
- `implementation-specialist`
  - narrow implementation inside an explicit file boundary
  - default mode: workspace-write
- `test-engineer`
  - tests, fixtures, validation plans, failure-path coverage
  - default mode: workspace-write
- `security-reviewer`
  - auth, secrets, privacy, tenant isolation, cryptography, fail-closed behavior
  - default mode: read-only
- `database-reviewer`
  - schemas, migrations, constraints, indexes, rollback, integrity
  - default mode: read-only
- `documentation-reviewer`
  - doc/code parity, runbooks, commands, claims, limits
  - default mode: read-only
- `advisor`
  - final technical adjudication and high-risk review gates
  - default mode: read-only

Write ownership rules:

- one writable subagent per file set;
- shared read-only review is allowed;
- the Executor integrates every accepted change;
- subagents do not commit, push, merge, deploy, publish, delete, run migration rollouts, or change dependencies;
- cross-scope findings must be reported back to the Executor, not self-expanded.