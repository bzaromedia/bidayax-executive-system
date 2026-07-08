# Settings Acceptance Tests

Phase 2 acceptance combines typed contracts, brand-token resolution, token-governed UI, immutable versioning, receptionist settings validation, and audit-event wiring.

## Foundation Checks

1. `TenantBrandProfile`, `ExecutiveCardProfile`, `ReceptionistSettings`, and `CardSettingsVersion` are typed.
2. Version status is `draft | preview | published | archived`.
3. Brand token resolution is deterministic and contrast-safe.
4. The settings dashboard remains token-governed.
5. No settings phase bypasses packages/tokens, packages/design-system, or packages/ui.

## Versioning Checks

- drafts can be created
- previews preserve the settings snapshot hash
- published versions are immutable
- replacement publishes archive the prior version
- invalid profile, brand-token, CTA, or receptionist data blocks publish
- publish results include IDs, hash, events, audit events, warnings, and validation details

## Receptionist Checks

- default language is included in supported languages
- enabled settings require approved voice and mood values
- custom greeting and consent rules are enforced
- fallback, routing, and escalation settings are validated
- previews are immutable
- invalid receptionist settings block publish
- receptionist preview, validation-failure, and publish events are emitted

## Audit Checks

`@bidayax/settings` must verify:

- all eight event names map to the standardized audit envelope
- audit IDs are deterministic and independent of metadata key order
- actor type, name, optional IP, and optional user agent are retained
- source and severity are assigned consistently
- current and previous snapshot hashes are represented
- sensitive metadata keys are excluded
- trails are tenant- and card-scoped
- trails sort chronologically and deduplicate IDs
- append operations do not mutate the original trail
- draft, preview, archive, validation failure, and publish operations return audit events

## Validation Commands

```powershell
pnpm typecheck
pnpm test
pnpm lint
pnpm verify:design-governance
pnpm verify:public-claims
git diff --check
```
