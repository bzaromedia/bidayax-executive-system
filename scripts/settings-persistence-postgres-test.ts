import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.SETTINGS_PERSISTENCE_TEST_DATABASE_URL;

function finish(status: "passed" | "skipped" | "failed", details: readonly string[]) {
  const output = {
    component: "settings-persistence-postgres-test",
    details,
    event: "settings_persistence_postgres_test_completed",
    status
  };

  const line = JSON.stringify(output);

  if (status === "failed") {
    console.error(line);
    process.exit(1);
  }

  console.info(line);
  process.exit(0);
}

if (process.env.NODE_ENV !== "test") {
  finish("skipped", ["NODE_ENV must be test to run PostgreSQL persistence integration checks."]);
}

if (!databaseUrl) {
  finish("skipped", ["SETTINGS_PERSISTENCE_TEST_DATABASE_URL is not configured."]);
}

const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.replace(/^\//, "");

if (!/test|ci|local/i.test(databaseName)) {
  finish("failed", [
    `Refusing to run against database '${databaseName}'. Use a disposable database name containing test, ci, or local.`
  ]);
}

const client = new Client({ connectionString: databaseUrl });
const migrationsDirectory = join(process.cwd(), "database", "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_.*\.sql$/.test(file))
  .sort();
const migrationSqlFiles = await Promise.all(
  migrationFiles.map(async (file) => ({
    file,
    sql: await readFile(join(migrationsDirectory, file), "utf8")
  }))
);

async function expectError(label: string, action: () => Promise<void>) {
  await client.query(`SAVEPOINT ${label}`);

  try {
    await action();
    throw new Error(`${label} did not fail as expected.`);
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${label}`);

    if (error instanceof Error && error.message.includes("did not fail")) {
      throw error;
    }
  } finally {
    await client.query(`RELEASE SAVEPOINT ${label}`);
  }
}

try {
  await client.connect();
  await client.query("BEGIN");
  for (const migration of migrationSqlFiles) {
    await client.query(migration.sql);
  }

  const tableCheck = await client.query<{ table_name: string }>(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'tenants',
          'brand_assets',
          'tenant_brand_profiles',
          'executive_card_profiles',
          'tenant_receptionist_settings',
          'card_settings_versions',
          'settings_audit_events',
          'settings_idempotency_keys'
        )
      order by table_name`
  );

  if (tableCheck.rowCount !== 8) {
    throw new Error(`Expected 8 settings tables, found ${tableCheck.rowCount ?? 0}.`);
  }

  await client.query(
    `insert into tenants (tenant_id, company_name, owner_email, status, created_at, updated_at)
     values ('tenant-test', 'Test Tenant', 'owner@example.test', 'active', now(), now())`
  );
  await client.query(
    `insert into tenants (tenant_id, company_name, owner_email, status, created_at, updated_at)
     values ('tenant-other', 'Other Tenant', 'owner-other@example.test', 'active', now(), now())`
  );
  await client.query(
    `insert into brand_assets (asset_id, tenant_id, asset_type, storage_path, alt_text, mime_type, checksum_sha256, created_at)
     values ('asset-test', 'tenant-test', 'logo', '/test/logo.svg', 'Logo', 'image/svg+xml', 'hash', now())`
  );
  await client.query(
    `insert into tenant_brand_profiles (
       tenant_id, company_name, logo_asset_id, favicon_asset_id, primary_color,
       secondary_color, accent_color, background_color, text_color, font_family,
       button_radius, card_radius, motion_intensity, contrast_mode, created_at, updated_at
     ) values (
       'tenant-test', 'Test Tenant', 'asset-test', 'asset-test', '#D4AF37',
       '#1A1A1A', '#D4AF37', '#111111', '#FFFFFF', 'Inter',
       '8px', '12px', 'standard', 'standard', now(), now()
     )`
  );
  await client.query(
    `insert into executive_card_profiles (
       card_id, tenant_id, executive_name, title, company, bio, profile_image_asset_id,
       phone, email, website, calendar_url, location, social_links, primary_cta,
       secondary_cta, qr_destination_mode, published_version, draft_version, status
     ) values (
       'card-test', 'tenant-test', 'Test Executive', 'Founder', 'Test Tenant',
       'Bio', 'asset-test', '+15555550100', 'exec@example.test', 'https://example.test',
       'https://example.test/calendar', 'Test City', '[]'::jsonb,
       '{"label":"Call","type":"call","destination":"tel:+15555550100","visible":true}'::jsonb,
       '{"label":"Email","type":"email","destination":"mailto:exec@example.test","visible":true}'::jsonb,
       'card_profile', null, null, 'draft'
     )`
  );
  await client.query(
    `insert into card_settings_versions (
       version_id, card_id, tenant_id, settings_snapshot, created_by, created_at,
       status, snapshot_hash, immutable, previous_version_id
     ) values (
       'version-published', 'card-test', 'tenant-test', '{"snapshotHash":"hash-1"}'::jsonb,
       'actor-test', now(), 'published', 'hash-1', true, null
     )`
  );
  await client.query(
    `insert into settings_audit_events (
       event_id, event_type, tenant_id, card_id, actor, occurred_at, source,
       snapshot_hash, previous_snapshot_hash, metadata, severity
     ) values (
       'audit-test', 'settings.published', 'tenant-test', 'card-test',
       '{"actorId":"actor-test","actorType":"user","displayName":"Tester"}'::jsonb,
       now(), 'settings-publish', 'hash-1', null, '{"safe":true}'::jsonb, 'info'
     )`
  );
  await client.query(
    `insert into settings_idempotency_keys (
       tenant_id, card_id, operation, idempotency_key, request_hash,
       result_version_id, result_snapshot_hash, created_at, expires_at
     ) values (
       'tenant-test', 'card-test', 'settings.publish', 'request-test', 'request-hash',
       'version-published', 'hash-1', now(), null
     )`
  );
  await client.query(
    `insert into card_settings_versions (
       version_id, card_id, tenant_id, settings_snapshot, created_by, created_at,
       status, snapshot_hash, immutable, previous_version_id
     ) values (
       'version-draft', 'card-test', 'tenant-test', '{"snapshotHash":"hash-draft"}'::jsonb,
       'actor-test', now(), 'draft', 'hash-draft', false, null
     )`
  );
  await client.query(
    `insert into settings_idempotency_keys (
       tenant_id, card_id, operation, idempotency_key, request_hash,
       result_version_id, result_snapshot_hash, created_at, expires_at
     ) values (
       'tenant-test', 'card-test', 'settings.preview', 'request-update', 'request-update-hash',
       'version-draft', 'hash-draft', now(), null
     )`
  );

  await expectError("tenant_card_mismatch_version_insert", async () => {
    await client.query(
      `insert into card_settings_versions (
         version_id, card_id, tenant_id, settings_snapshot, created_by, created_at,
         status, snapshot_hash, immutable, previous_version_id
       ) values (
         'version-mismatched', 'card-test', 'tenant-other', '{"snapshotHash":"hash-mismatch"}'::jsonb,
         'actor-test', now(), 'draft', 'hash-mismatch', false, null
       )`
    );
  });

  await expectError("tenant_card_mismatch_version_update", async () => {
    await client.query(
      `update card_settings_versions
          set tenant_id = 'tenant-other'
        where version_id = 'version-draft'`
    );
  });

  await expectError("tenant_card_mismatch_audit_insert", async () => {
    await client.query(
      `insert into settings_audit_events (
         event_id, event_type, tenant_id, card_id, actor, occurred_at, source,
         snapshot_hash, previous_snapshot_hash, metadata, severity
       ) values (
         'audit-mismatched', 'settings.preview.generated', 'tenant-other', 'card-test',
         '{"actorId":"actor-test","actorType":"user","displayName":"Tester"}'::jsonb,
         now(), 'settings-preview', 'hash-draft', null, '{"safe":true}'::jsonb, 'info'
       )`
    );
  });

  await expectError("tenant_card_mismatch_idempotency_insert", async () => {
    await client.query(
      `insert into settings_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_version_id, result_snapshot_hash, created_at, expires_at
       ) values (
         'tenant-other', 'card-test', 'settings.publish', 'request-mismatched', 'request-mismatch-hash',
         'version-published', 'hash-1', now(), null
       )`
    );
  });

  await expectError("tenant_card_mismatch_idempotency_update", async () => {
    await client.query(
      `update settings_idempotency_keys
          set tenant_id = 'tenant-other'
        where tenant_id = 'tenant-test'
          and card_id = 'card-test'
          and operation = 'settings.preview'
          and idempotency_key = 'request-update'`
    );
  });

  await expectError("duplicate_published", async () => {
    await client.query(
      `insert into card_settings_versions (
         version_id, card_id, tenant_id, settings_snapshot, created_by, created_at,
         status, snapshot_hash, immutable, previous_version_id
       ) values (
         'version-published-2', 'card-test', 'tenant-test', '{"snapshotHash":"hash-2"}'::jsonb,
         'actor-test', now(), 'published', 'hash-2', true, null
       )`
    );
  });

  await expectError("mutate_published", async () => {
    await client.query(
      `update card_settings_versions
          set settings_snapshot = '{"snapshotHash":"mutated"}'::jsonb
        where version_id = 'version-published'`
    );
  });

  await expectError("mutate_audit", async () => {
    await client.query(
      `update settings_audit_events
          set metadata = '{"mutated":true}'::jsonb
        where event_id = 'audit-test'`
    );
  });

  await expectError("idempotency_conflict", async () => {
    await client.query(
      `insert into settings_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_version_id, result_snapshot_hash, created_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'settings.publish', 'request-test', 'different-hash',
         'version-published', 'hash-1', now(), null
       )`
    );
  });

  await client.query("ROLLBACK");
  finish("passed", [
    `complete migration chain applied inside a transaction (${migrationFiles.length} files)`,
    "settings tables exist",
    "tenant/card mismatch inserts rejected",
    "tenant/card mismatch updates rejected",
    "duplicate active published version rejected",
    "published version mutation rejected",
    "audit event mutation rejected",
    "idempotency key conflict rejected"
  ]);
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Ignore rollback failures during connection/setup errors.
  }

  finish("failed", [error instanceof Error ? error.message : String(error)]);
} finally {
  await client.end().catch(() => undefined);
}
