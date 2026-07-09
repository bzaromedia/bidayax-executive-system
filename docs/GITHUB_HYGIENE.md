# GitHub Hygiene

This file records the Phase 2 GitHub discipline for the Executive Card Modularity & Settings Layer work.

## Source Of Truth

All active project files for this phase live inside:

```text
D:\bidayax-executive-system
```

Files outside that root are not project source of truth and were not used for this phase.

## Branch

```text
feature/settings-modularity-layer
```

Base branch:

```text
main
```

## Phase Commits

- `83ebfdf feat(settings): add executive card modularity foundation`
- `a9c00dc feat(tokens): implement brand token resolver`
- `8bf8027 feat(settings-ui): add executive card settings interface`
- `c67b14c feat(settings): add preview publish versioning flow`
- `7fac8e3 feat(receptionist): integrate receptionist settings workflow`
- `5be0ce3 feat(settings): add audit event ledger wiring`

Phase 2G adds only final review and PR-prep documentation.

## Scope Rules

- Keep all active files inside `D:\bidayax-executive-system`.
- Do not commit generated package stores, `node_modules`, local secrets, or machine-specific configuration.
- Do not use duplicate files from outside the repository root.
- Do not add Claude Code artifacts.
- Do not add live provider integrations in Phase 2.
- Do not add database migrations before Phase 3.
- Do not merge the feature branch during Phase 2G.
- Open a draft PR only after validation and push succeed.

## Final Phase 2 Review Checks

The Phase 2G review must confirm:

- The current branch is `feature/settings-modularity-layer`.
- The working tree is clean before push except for intentional final docs before commit.
- No files under `database/migrations/` are added by this branch.
- No Claude Code artifacts are present.
- No Twilio, Telnyx, Vapi, Bland, Retell, or other provider integration files are added by this branch.
- Design governance still passes.
- Public claims verification still passes.
- Tests cover brand token resolution, settings versioning, publish flow, receptionist validation, and audit events.

## Validation Commands

```powershell
pnpm typecheck
pnpm test
pnpm lint
pnpm verify:design-governance
pnpm verify:public-claims
git diff --check
git status
git log --oneline -8
```

## PR Prep

Draft PR title:

```text
Phase 2 - Executive Card Settings Modularity Layer
```

The PR body must include:

- Summary
- Phase 2A-2F completed work
- Validation commands
- Risk notes
- What was intentionally not added
- Next phase recommendation
