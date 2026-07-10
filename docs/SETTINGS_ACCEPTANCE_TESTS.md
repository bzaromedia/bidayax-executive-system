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

## Phase 2G Final Review Checks

The final review must pass before pushing `feature/settings-modularity-layer` and opening the draft PR.

- current branch is `feature/settings-modularity-layer`
- Phase 2 commit history contains 2A through 2F
- all active project files remain inside `D:\bidayax-executive-system`
- no database migration files were added in this phase
- no Claude Code artifacts are present
- no live provider integrations were added
- token resolver tests cover valid input, invalid color input, unsafe contrast, fallbacks, warnings, and deterministic hashes
- settings versioning tests cover draft, preview, publish, archive, invalid publish, and emitted events
- receptionist settings tests cover language, voice, mood, greeting, consent, fallback, routing, and escalation validation
- audit tests cover standardized envelopes, deterministic IDs, actor metadata, sanitized metadata, snapshot references, filtering, deduplication, and immutable append behavior
- design governance passes
- public claims verification passes
- the feature branch is pushed for review without merging

## Phase 2G PR Checklist

The draft PR must include:

- Summary
- Phase 2A-2F completed work
- Validation commands and results
- Risk notes
- What was intentionally not added
- Next phase recommendation

## Phase 3 Persistence Checks

Phase 3 acceptance requires:

- migration `0014_create_settings_persistence_layer.sql` exists and passes migration verification
- tenant, asset, brand profile, card profile, receptionist settings, version, and audit event tables are documented
- repository functions serialize and read typed settings data without importing provider integrations
- settings publish results can persist versions and audit events
- rollback notes exist
- no live telephony or provider integrations are introduced
