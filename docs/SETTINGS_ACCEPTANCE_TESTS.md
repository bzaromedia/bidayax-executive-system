# Settings Acceptance Tests

Phase 2 acceptance combines typed contracts, resolver behavior, UI shell checks,
and preview/publish/versioning behavior.

## Required Checks

1. `TenantBrandProfile` exists and contains all required brand fields.
2. `ExecutiveCardProfile` exists and contains profile, CTA, social, QR, version, and status fields.
3. `ReceptionistSettings` exists and contains language, voice, mood, greeting, routing, escalation, consent, and recording policy fields.
4. `CardSettingsVersion` exists and uses `draft | preview | published | archived`.
5. Brand Token Resolution Algorithm is documented and tested.
6. Settings Version Publish Algorithm is documented and tested.
7. PostgreSQL table model is documented for tenants, brand profiles, card profiles, receptionist settings, versions, assets, and audit events.
8. Event Ledger hooks are documented for `settings.draft.created`, `settings.preview.generated`, `settings.publish.validation_failed`, `settings.published`, and `settings.version.archived`.
9. Top-right settings icon placement is documented and tested.
10. No Phase 2 changes bypass design governance.

## Phase 2D Package Tests

`@bidayax/settings` must verify:

- edits can be saved as draft versions
- preview versions are generated from drafts
- publish validation blocks missing required fields
- publish validation blocks unsafe resolved brand tokens
- publishing creates immutable published versions
- publishing archives the previous published version
- publish results include version IDs, snapshot hash, emitted events, and warnings

## Suggested Commands

```powershell
pnpm typecheck
pnpm test
pnpm lint
pnpm verify:design-governance
pnpm verify:public-claims
git diff --check
```

If build or test infrastructure is unavailable, the reviewer must record the blocker in the phase handoff.
