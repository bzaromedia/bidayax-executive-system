# Settings Persistence Rollback Notes

Phase 3 migration:

```text
database/migrations/0014_create_settings_persistence_layer.sql
```

The migration is additive. It creates new tables and indexes for the settings persistence layer and does not remove or rename existing production tables.

## Rollback Preconditions

Before rollback:

1. Confirm no production card is actively reading from the Phase 3 settings tables.
2. Export any settings data that must be preserved.
3. Confirm the application version being deployed no longer depends on `@bidayax/settings` persistence repositories.
4. Run rollback during a maintenance window if production writes have started.

## Manual Rollback SQL

Run in this order:

```sql
drop table if exists settings_audit_events;
drop table if exists card_settings_versions;
drop table if exists tenant_receptionist_settings;
drop table if exists executive_card_profiles;
drop table if exists tenant_brand_profiles;
drop table if exists brand_assets;
drop table if exists tenants;
```

The partial unique index on `card_settings_versions` is dropped automatically with the table.

## Data Export

If data must be preserved before rollback:

```sql
copy tenants to '/tmp/the-executive-card-tenants.csv' csv header;
copy tenant_brand_profiles to '/tmp/the-executive-card-brand-profiles.csv' csv header;
copy executive_card_profiles to '/tmp/the-executive-card-card-profiles.csv' csv header;
copy tenant_receptionist_settings to '/tmp/the-executive-card-receptionist-settings.csv' csv header;
copy card_settings_versions to '/tmp/the-executive-card-settings-versions.csv' csv header;
copy settings_audit_events to '/tmp/the-executive-card-settings-audit-events.csv' csv header;
```

Adjust paths for the production database host and permissions.

## Safety Notes

- Do not drop the earlier `receptionist_settings` table from migration `0013`; it belongs to the prior card customization slice.
- Do not drop Event Ledger, contact graph, intent scoring, telemetry, telephony, or receptionist workflow tables.
- Do not run global database cleanup commands.
