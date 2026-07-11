# Settings Model

The Executive Card Modularity & Settings Layer stores settings as versioned
configuration snapshots. Runtime card UI, dashboard views, receptionist
workflows, and event ledger integrations consume published snapshots instead of
mutating presentation components directly.

## Tables

### tenants

Primary owner record for a purchased Executive Card tenant.

Columns:
- `tenant_id uuid primary key`
- `company_name text not null`
- `owner_email text not null`
- `status text not null check (status in ('active', 'suspended', 'archived'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `tenants_owner_email_idx` on `owner_email`
- `tenants_status_idx` on `status`

Constraints:
- `owner_email` must be normalized before insert.
- Archived tenants may not publish new card settings.

### executive_card_profiles

Draft and published card content for one executive identity.

Columns:
- `card_id uuid primary key`
- `tenant_id uuid not null references tenants(tenant_id)`
- `executive_name text not null`
- `title text not null`
- `company text not null`
- `bio text not null`
- `profile_image_asset_id uuid references brand_assets(asset_id)`
- `phone text not null`
- `email text not null`
- `website text not null`
- `calendar_url text`
- `location text not null`
- `social_links jsonb not null default '[]'::jsonb`
- `primary_cta jsonb not null`
- `secondary_cta jsonb not null`
- `qr_destination_mode text not null`
- `published_version uuid`
- `draft_version uuid`
- `status text not null check (status in ('draft', 'preview', 'published', 'archived'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `executive_card_profiles_tenant_id_idx` on `tenant_id`
- `executive_card_profiles_status_idx` on `status`
- `executive_card_profiles_published_version_idx` on `published_version`

Constraints:
- `email`, `website`, and `calendar_url` are validated before publish.
- `published_version` references an immutable published settings snapshot.
- `draft_version` references the latest editable snapshot.

### card_settings_versions

Immutable versioned snapshots of all settings needed to render a card.

Columns:
- `version_id uuid primary key`
- `card_id uuid not null references executive_card_profiles(card_id)`
- `tenant_id uuid not null references tenants(tenant_id)`
- `settings_snapshot jsonb not null`
- `created_by text not null`
- `created_at timestamptz not null default now()`
- `status text not null check (status in ('draft', 'preview', 'published', 'archived'))`

Indexes:
- `card_settings_versions_card_id_idx` on `card_id`
- `card_settings_versions_tenant_id_idx` on `tenant_id`
- `card_settings_versions_status_idx` on `status`
- Unique partial index on `(card_id)` where `status = 'published'`.

Versioning rules:
- Draft versions may be replaced before preview.
- Preview versions are read-only acceptance candidates.
- Published versions are immutable.
- Publishing archives the prior published version for the same card.
- Publishing emits `settings.published` to the Event Ledger.

### settings_audit_events

Append-only record of settings lifecycle actions.

Columns:
- `event_id uuid primary key`
- `tenant_id uuid not null references tenants(tenant_id)`
- `card_id uuid references executive_card_profiles(card_id)`
- `version_id uuid references card_settings_versions(version_id)`
- `event_type text not null`
- `actor_id text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Indexes:
- `settings_audit_events_tenant_id_idx` on `tenant_id`
- `settings_audit_events_card_id_idx` on `card_id`
- `settings_audit_events_event_type_idx` on `event_type`
- `settings_audit_events_created_at_idx` on `created_at`

Event types:
- `settings.created`
- `settings.updated`
- `settings.previewed`
- `settings.published`

Rules:
- Audit events are append-only.
- Sensitive values are never stored raw in `metadata`.
- Events may be mirrored into the Executive Event Ledger for dashboard
  intelligence.

## Relationships

- One `tenant` owns many `executive_card_profiles`.
- One `tenant` owns one active `tenant_brand_profile`.
- One `executive_card_profile` has many `card_settings_versions`.
- One `card_settings_version` contains a complete render-safe settings snapshot.
- One settings lifecycle action creates one `settings_audit_event`.

## Publish Safety

Publishing is blocked unless:
- required profile fields are present;
- brand token resolution passes;
- referenced assets exist and are approved;
- receptionist routing rules validate;
- preview acceptance checks pass;
- the new version can be stored as an immutable snapshot.

## Phase 3 Persistence Implementation

Phase 3 adds the production persistence tables in:

```text
database/migrations/0014_create_settings_persistence_layer.sql
```

Implemented tables:

- `tenants`
- `brand_assets`
- `tenant_brand_profiles`
- `executive_card_profiles`
- `tenant_receptionist_settings`
- `card_settings_versions`
- `settings_audit_events`

The earlier migration `0013_create_card_customization_settings.sql` already contains a table named `receptionist_settings` for the prior card customization slice. Phase 3 therefore uses `tenant_receptionist_settings` for the modular settings layer to avoid overwriting or reshaping existing deployed data.

The `@bidayax/settings` package now exposes repository and service helpers for these tables. They require a query executor and do not create a direct dependency on a provider-specific database client.
