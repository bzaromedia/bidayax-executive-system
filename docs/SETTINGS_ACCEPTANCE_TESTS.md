# Settings Acceptance Tests

Phase 2 acceptance combines typed contracts, brand-token resolution, token-governed UI, immutable versioning, and receptionist settings validation.

## Foundation Checks

1. `TenantBrandProfile`, `ExecutiveCardProfile`, `ReceptionistSettings`, and `CardSettingsVersion` are typed.
2. Version status is `draft | preview | published | archived`.
3. Brand token resolution is deterministic and contrast-safe.
4. The top-right settings entry and settings dashboard remain token-governed.
5. No settings phase bypasses packages/tokens, packages/design-system, or packages/ui.

## Versioning Checks

- drafts can be created
- previews preserve the settings snapshot hash
- published versions are immutable
- replacement publishes archive the prior version
- invalid required profile or brand-token data blocks publish
- publish results include IDs, hash, events, warnings, and validation details

## Receptionist Checks

`@bidayax/settings` must verify:

- enabled is boolean
- default language is supported
- enabled settings require an approved voice profile
- mood and greeting mode are approved
- custom greeting is required in custom mode
- consent is required when automation or recording is enabled
- fallback behavior is approved
- routes require condition, destination, and priority
- escalation contacts require a name and valid contact method
- previews select the effective greeting and are immutable
- disabled settings can preview safely
- invalid receptionist settings block publish
- preview, validation-failure, and publish events are emitted

## Event Names

- `settings.draft.created`
- `settings.preview.generated`
- `settings.publish.validation_failed`
- `settings.published`
- `settings.version.archived`
- `receptionist.settings.previewed`
- `receptionist.settings.validation_failed`
- `receptionist.settings.published`

## Validation Commands

```powershell
pnpm typecheck
pnpm test
pnpm lint
pnpm verify:design-governance
pnpm verify:public-claims
git diff --check
```
