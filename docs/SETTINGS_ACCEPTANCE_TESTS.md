# Settings Acceptance Tests

Phase 2A acceptance is documentation and type-contract focused.

## Required Checks

1. `TenantBrandProfile` exists and contains all required brand fields.
2. `ExecutiveCardProfile` exists and contains profile, CTA, social, QR, version, and status fields.
3. `ReceptionistSettings` exists and contains language, voice, mood, greeting, routing, escalation, consent, and recording policy fields.
4. `CardSettingsVersion` exists and uses `draft | preview | published | archived`.
5. Brand Token Resolution Algorithm is documented.
6. Settings Version Publish Algorithm is documented.
7. PostgreSQL table model is documented for tenants, brand profiles, card profiles, receptionist settings, versions, assets, and audit events.
8. Event Ledger hooks are documented for `settings.created`, `settings.updated`, `settings.previewed`, and `settings.published`.
9. Top-right settings icon placement is documented.
10. No Phase 2A changes bypass design governance.

## Suggested Commands

```powershell
pnpm typecheck
pnpm test
pnpm verify:design-governance
pnpm verify:public-claims
```

If build or test infrastructure is unavailable, the reviewer must record the blocker in the Phase 2A handoff.
