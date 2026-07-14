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

## Phase 3G Branch Hygiene

- Active branch: `feature/settings-modularity-layer`
- Do not rewrite commit `a1c388e`.
- Commit Phase 3G corrective changes separately.
- Push the existing branch only; do not create a second PR.
- Keep the PR in draft unless all mandatory local validation passes and PostgreSQL integration status is accurately documented.
- Do not merge until reviewer approval and deployment readiness checks are complete.

## Phase 5 GitHub Hygiene Addendum

Phase 5 must be reviewed in a separate draft PR from `feature/production-identity-provider-integration` into `main`.

Reviewer checklist:

- Verify no telephony provider packages or credentials were added.
- Verify no production WorkOS credentials are committed.
- Verify migration `0015` applies in the full migration chain.
- Verify PostgreSQL integration evidence is attached to the PR.
- Verify identity docs match implemented behavior.
- Verify settings authorization still derives tenant/card scope server-side.
- Verify production calling remains disabled.
## Phase 6 Telephony Foundation Hygiene

Phase 6 branch: `feature/telephony-domain-foundation`.

Git rules for this phase:

- Keep all files inside `D:\bidayax-executive-system`.
- Commit only provider-independent telephony foundation changes.
- Do not add telephony provider SDKs or credentials.
- Do not enable production calling.
- Create a draft PR targeting `main`.
- Do not merge without review and explicit approval.

Validation evidence must include local checks and PostgreSQL integration status when migrations are added.
## Phase 7G Git Hygiene

Phase 7G changes are limited to sandbox provider hardening, readiness metadata, focused tests, and documentation. No provider SDKs, generated binaries, production credentials, or telephony activation files should be committed.
