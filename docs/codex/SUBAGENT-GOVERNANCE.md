# Subagent Governance

Every delegation must specify:

- objective
- exact scope
- allowed files or directories
- prohibited files or directories
- read-only or write-enabled status
- governing requirements
- required commands
- required evidence
- output format
- stopping conditions

Rules:

- subagents must not overlap file writes
- prefer read-only subagents for exploration and review
- subagents must not broaden scope independently
- subagents must report uncertainty instead of guessing
- subagents must not commit, merge, push, deploy, publish, delete, run migration rollouts, or change dependencies
- the Executor verifies every subagent conclusion
- failed or incomplete subagent work must be reported, not concealed

The Advisor is not a general worker. It is a review authority at defined gates.