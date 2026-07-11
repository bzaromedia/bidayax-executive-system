# Settings Persistence Layer

Phase 3 adds PostgreSQL persistence for the Executive Card Modularity & Settings Layer.

## Scope

Implemented persistence covers:

- tenants
- tenant brand profiles
- executive card profiles
- tenant-scoped Polyglot Receptionist settings
- brand assets
- card settings versions
- settings audit events

This phase does not add provider integrations, live telephony, marketing, or settings write APIs.

## Migration

Migration:

```text
database/migrations/0014_create_settings_persistence_layer.sql
```

The migration is additive and does not rewrite deployed migration history.

## Tables

### tenants

Stores tenant ownership and status.

Primary key:

```text
tenant_id
```

### brand_assets

Stores asset references only. The database does not store raw large images.

Stored values:

- asset ID
- tenant ID
- asset type
- storage path
- alt text
- MIME type
- checksum
- creation timestamp

### tenant_brand_profiles

Stores raw tenant brand input before token resolution.

The design system remains the authority for final rendering. The persisted brand profile feeds the brand-token resolver, which returns safe resolved tokens.

### executive_card_profiles

Stores editable executive card content:

- executive name
- title
- company
- bio
- contact fields
- social links
- CTA buttons
- QR destination mode
- draft and published version references
- profile status

### tenant_receptionist_settings

Stores Phase 3 tenant-scoped receptionist configuration.

The existing `receptionist_settings` table from the earlier card customization slice is left untouched to avoid breaking deployed card customization data. Phase 3 uses `tenant_receptionist_settings` for the settings modularity branch.

### card_settings_versions

Stores immutable settings snapshots for:

- draft
- preview
- published
- archived

A partial unique index allows only one current published version per tenant/card pair.

### settings_audit_events

Stores Event Ledger-ready audit events from the settings workflow. Audit metadata must not contain secrets.

## Repository API

The settings package exposes:

```ts
createSettingsPersistenceRepository(executor)
persistSettingsSnapshot(input)
persistSettingsPublishResult(input)
persistSettingsAuditEvents(repository, events)
```

The repository accepts a small query executor instead of importing `pg` directly:

```ts
type SettingsQueryExecutor = {
  query<Row>(text: string, values?: readonly unknown[]): Promise<{
    rows: readonly Row[];
    rowCount?: number | null;
  }>;
};
```

This keeps `@bidayax/settings` provider-neutral. Future dashboard/API routes can pass a Postgres Pool because `pg.Pool` already matches the expected query shape closely enough for an adapter.

## Persistence Order

Snapshot persistence writes:

1. tenant
2. brand assets
3. tenant brand profile
4. executive card profile
5. receptionist settings

Publish result persistence writes:

1. settings versions
2. settings audit events

## Current Limitations

- No production API route writes settings yet.
- No database transaction wrapper is added in this phase.
- No live provider dispatch is added.
- No upload provider is added.
- Existing dashboard settings UI still uses typed preview state until Phase 3 API wiring is implemented.

## Next Step

Phase 3B should wire authenticated dashboard API routes to the repository and wrap multi-step writes in a transaction boundary.

## Phase 3G Hardening Addendum

Phase 3G added the following persistence safeguards:

- tenant-scoped repository reads for assets, cards, versions, audit events, and idempotency records
- cross-tenant upsert rejection for brand assets and executive card profiles
- append-only audit event persistence
- immutable settings version insert behavior
- dedicated published-version archive method
- publish card-row locking with `FOR UPDATE`
- archive-before-publish sequencing
- `settings_idempotency_keys` table for duplicate publish submissions
- database triggers for published-version immutability and audit append-only enforcement
- guarded PostgreSQL integration harness: `pnpm test:settings-persistence:postgres`

The PostgreSQL harness requires `NODE_ENV=test` and `SETTINGS_PERSISTENCE_TEST_DATABASE_URL` pointed at a disposable database whose name contains `test`, `ci`, or `local`.
