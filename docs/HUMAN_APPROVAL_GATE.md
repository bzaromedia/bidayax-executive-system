# Human Approval Gate

Phase 13 requires human approval before a candidate can move to an approved state.

## Rules

- No candidate can be implemented automatically.
- No candidate can be marked approved without an approval event.
- Rejected candidates remain archived.
- Approved candidates still require future sandbox implementation.
- Approval does not deploy anything.

## Approval Decisions

- `approved`
- `rejected`
- `needs_more_evidence`
- `blocked`

## Dashboard Language

Use:

- Human approval required.
- Approved for future sandbox work.
- Needs more evidence.
- Blocked.

Do not use:

- Automatically deployed.
- Self-improved.
- Autonomous agent completed.
