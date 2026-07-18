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

  const identityTableCheck = await client.query<{ table_name: string }>(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'user_identities',
          'identity_provider_accounts',
          'identity_provider_tenant_links',
          'tenant_memberships',
          'card_access_grants',
          'application_sessions',
          'identity_oauth_transactions',
          'identity_audit_events',
          'identity_webhook_receipts'
        )
      order by table_name`
  );

  if (identityTableCheck.rowCount !== 9) {
    throw new Error(
      `Expected 9 identity tables, found ${identityTableCheck.rowCount ?? 0}.`
    );
  }

  const telephonyTableCheck = await client.query<{ table_name: string }>(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'telephony_phone_numbers',
          'telephony_call_sessions',
          'telephony_call_queues',
          'telephony_callback_requests',
          'telephony_appointment_requests',
          'telephony_call_transcripts',
          'telephony_voice_profiles',
          'telephony_call_recordings',
          'telephony_voicemails',
          'telephony_routing_rules',
          'telephony_escalation_policies',
          'telephony_usage_ledger',
          'telephony_audit_events',
          'telephony_consent_policies',
          'telephony_emergency_policy_signals',
          'telephony_command_idempotency_keys'
        )
      order by table_name`
  );

  if (telephonyTableCheck.rowCount !== 16) {
    throw new Error(
      `Expected 16 telephony domain tables, found ${telephonyTableCheck.rowCount ?? 0}.`
    );
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
    `insert into telephony_phone_numbers (
       phone_number_id, tenant_id, e164_number, extension, status, capabilities,
       country, timezone, provider_reference, created_at, updated_at
     ) values (
       'phone-telephony-test', 'tenant-test', '+15555550123', null, 'reserved',
       '["voice","inbound"]'::jsonb, 'US', 'America/New_York', null, now(), now()
     )`
  );
  await client.query(
    `insert into telephony_call_sessions (
       session_id, tenant_id, card_id, phone_number_id, caller, callee, direction,
       state, start_time, metadata
     ) values (
       'session-telephony-test', 'tenant-test', 'card-test', 'phone-telephony-test',
       '{"phoneNumber":"+15555550100"}'::jsonb,
       '{"phoneNumber":"+15555550123"}'::jsonb,
       'inbound', 'requested', now(), '{"providerIndependent":true}'::jsonb
     )`
  );
  await client.query(
    `insert into telephony_usage_ledger (
       ledger_entry_id, tenant_id, card_id, session_id, category, quantity, unit,
       unit_cost_cents, currency, amount_cents, estimated_cost_cents, provider_reference,
       correlation_id, source, reversal_of_ledger_entry_id, occurred_at, metadata
     ) values (
       'usage-telephony-test', 'tenant-test', 'card-test', 'session-telephony-test',
       'provider_minutes', 0, 'minute', 0, 'USD', 0, 0, null,
       'corr-telephony-test', 'control_plane', null, now(), '{"futureProvider":true}'::jsonb
     )`
  );
  await client.query(
    `insert into telephony_audit_events (
       event_id, event_type, tenant_id, card_id, session_id, actor, occurred_at,
       severity, metadata
     ) values (
       'audit-telephony-test', 'telephony.call.requested', 'tenant-test', 'card-test',
       'session-telephony-test',
       '{"actorId":"system","actorType":"system","displayName":"Telephony Control Plane"}'::jsonb,
       now(), 'info', '{"safe":true}'::jsonb
     )`
  );

  await client.query(
    `insert into telephony_consent_policies (
       consent_policy_id, tenant_id, card_id, policy_version, jurisdiction,
       communication_purpose, recording_allowed, transcription_allowed,
       ai_disclosure_required, consent_source, consent_timestamp, evidence_reference
     ) values (
       'consent-telephony-test', 'tenant-test', 'card-test', 'v1', 'US',
       'callback', false, false, true, 'system_default', null, 'policy-doc'
     )`
  );
  await client.query(
    `insert into telephony_emergency_policy_signals (
       signal_id, tenant_id, card_id, session_id, detected_at, classification,
       action, human_escalation_required, message, evidence_reference
     ) values (
       'emergency-telephony-test', 'tenant-test', 'card-test', 'session-telephony-test',
       now(), 'emergency_language', 'escalate_human', true,
       'If this is an emergency, contact local emergency services directly.', 'signal-fixture'
     )`
  );
  await client.query(
    `insert into telephony_command_idempotency_keys (
       tenant_id, card_id, operation, idempotency_key, request_hash,
       result_session_id, created_at, expires_at
     ) values (
       'tenant-test', 'card-test', 'telephony.call.request', 'telephony-request-test',
       'request-hash', 'session-telephony-test', now(), null
     )`
  );

  await expectError("telephony_command_idempotency_duplicate", async () => {
    await client.query(
      `insert into telephony_command_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_session_id, created_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'telephony.call.request', 'telephony-request-test',
         'other-hash', 'session-telephony-test', now(), null
       )`
    );
  });
  await expectError("telephony_tenant_card_mismatch_session", async () => {
    await client.query(
      `insert into telephony_call_sessions (
         session_id, tenant_id, card_id, phone_number_id, caller, callee, direction,
         state, start_time, metadata
       ) values (
         'session-telephony-mismatch', 'tenant-other', 'card-test', 'phone-telephony-test',
         '{"phoneNumber":"+15555550100"}'::jsonb,
         '{"phoneNumber":"+15555550123"}'::jsonb,
         'inbound', 'requested', now(), '{}'::jsonb
       )`
    );
  });

  await expectError("telephony_usage_append_only", async () => {
    await client.query(
      `update telephony_usage_ledger
          set estimated_cost_cents = 1
        where ledger_entry_id = 'usage-telephony-test'`
    );
  });

  await expectError("telephony_audit_append_only", async () => {
    await client.query(
      `delete from telephony_audit_events
        where event_id = 'audit-telephony-test'`
    );
  });
  await client.query(
    `insert into user_identities (
       user_id, provider, provider_subject, email, normalized_email,
       email_verified, display_name, status, created_at, updated_at, last_authenticated_at
     ) values (
       'user-identity-test', 'workos', 'provider-user-test', 'identity@example.test',
       'identity@example.test', true, 'Identity Tester', 'active', now(), now(), now()
     )`
  );
  await client.query(
    `insert into identity_provider_accounts (
       provider_account_id, user_id, provider, provider_subject, provider_tenant_id,
       provider_metadata, created_at, updated_at
     ) values (
       'provider-account-test', 'user-identity-test', 'workos', 'provider-user-test',
       'provider-tenant-test', '{}'::jsonb, now(), now()
     )`
  );
  await client.query(
    `insert into identity_provider_tenant_links (
       provider, provider_tenant_id, tenant_id
     ) values ('workos', 'provider-tenant-test', 'tenant-test')`
  );
  await client.query(
    `insert into tenant_memberships (
       membership_id, tenant_id, user_id, role, status, created_at, updated_at
     ) values (
       'membership-identity-test', 'tenant-test', 'user-identity-test',
       'tenant_admin', 'active', now(), now()
     )`
  );
  await client.query(
    `insert into card_access_grants (
       grant_id, tenant_id, card_id, user_id, permission_set, created_at
     ) values (
       'grant-identity-test', 'tenant-test', 'card-test', 'user-identity-test',
       '["settings:read"]'::jsonb, now()
     )`
  );
  await client.query(
    `insert into application_sessions (
       session_id, session_token_hash, csrf_token_hash, user_id, tenant_id,
       provider, provider_session_id, authentication_method, created_at,
       last_seen_at, idle_expires_at, absolute_expires_at
     ) values (
       'session-identity-test', 'session-token-hash', 'csrf-token-hash',
       'user-identity-test', 'tenant-test', 'workos', 'provider-session-test',
       'Passkey', now(), now(), now() + interval '30 minutes', now() + interval '8 hours'
     )`
  );
  await client.query(
    `insert into identity_audit_events (
       event_id, event_type, user_id, tenant_id, session_id, provider,
       occurred_at, result, reason_code, metadata
     ) values (
       'identity-audit-test', 'identity.session.created', 'user-identity-test',
       'tenant-test', 'session-identity-test', 'workos', now(), 'succeeded',
       'APPLICATION_SESSION_CREATED', '{"safe":true}'::jsonb
     )`
  );
  await client.query(
    `insert into identity_webhook_receipts (
       provider, provider_event_id, event_type, occurred_at, received_at, payload_hash
     ) values (
       'workos', 'provider-event-test', 'session.created', now(), now(), 'payload-hash'
     )`
  );

  await expectError("identity_cross_tenant_card_grant", async () => {
    await client.query(
      `insert into card_access_grants (
         grant_id, tenant_id, card_id, user_id, permission_set, created_at
       ) values (
         'grant-cross-tenant', 'tenant-other', 'card-test', 'user-identity-test',
         '["settings:read"]'::jsonb, now()
       )`
    );
  });

  await expectError("identity_duplicate_provider_subject", async () => {
    await client.query(
      `insert into user_identities (
         user_id, provider, provider_subject, email, normalized_email,
         email_verified, display_name, status, created_at, updated_at, last_authenticated_at
       ) values (
         'user-identity-duplicate', 'workos', 'provider-user-test', 'duplicate@example.test',
         'duplicate@example.test', true, 'Duplicate', 'active', now(), now(), now()
       )`
    );
  });

  await expectError("identity_duplicate_webhook", async () => {
    await client.query(
      `insert into identity_webhook_receipts (
         provider, provider_event_id, event_type, occurred_at, received_at, payload_hash
       ) values (
         'workos', 'provider-event-test', 'session.created', now(), now(), 'other-hash'
       )`
    );
  });

  await expectError("identity_audit_append_only", async () => {
    await client.query(
      `update identity_audit_events
          set metadata = '{"mutated":true}'::jsonb
        where event_id = 'identity-audit-test'`
    );
  });

  await client.query(
    `update tenant_memberships
        set status = 'revoked', revoked_at = now(), updated_at = now()
      where membership_id = 'membership-identity-test'`
  );
  const revokedSession = await client.query<{ revoked_at: string | null }>(
    `select revoked_at from application_sessions
      where session_id = 'session-identity-test'`
  );
  if (!revokedSession.rows[0]?.revoked_at) {
    throw new Error("Membership revocation did not revoke the active session.");
  }

  await expectError("identity_revoked_membership_session", async () => {
    await client.query(
      `insert into application_sessions (
         session_id, session_token_hash, csrf_token_hash, user_id, tenant_id,
         provider, authentication_method, created_at, last_seen_at,
         idle_expires_at, absolute_expires_at
       ) values (
         'session-revoked-membership', 'session-revoked-hash', 'csrf-revoked-hash',
         'user-identity-test', 'tenant-test', 'workos', 'Password',
         now(), now(), now() + interval '30 minutes', now() + interval '8 hours'
       )`
    );
  });
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


  await client.query(
    `insert into trust_crypto_identities (
       identity_id, tenant_id, structure_version, identity_type, display_name,
       status, metadata, created_at, updated_at
     ) values
       ('trust-identity-test', 'tenant-test', '1', 'service', 'Trust Test Identity', 'active', '{}'::jsonb, now(), now()),
       ('trust-identity-other', 'tenant-other', '1', 'service', 'Trust Other Identity', 'active', '{}'::jsonb, now(), now())`
  );

  const trustKeyPrimaryKey = await client.query<{ column_name: string }>(
    `select a.attname as column_name
       from pg_constraint c
       join pg_class t on t.oid = c.conrelid
       join unnest(c.conkey) with ordinality as cols(attnum, ordinality) on true
       join pg_attribute a on a.attrelid = t.oid and a.attnum = cols.attnum
      where t.relname = 'trust_keys'
        and c.contype = 'p'
      order by cols.ordinality`
  );
  if (trustKeyPrimaryKey.rows.map((row) => row.column_name).join(",") !== "tenant_id,key_id,key_version") {
    throw new Error("trust_keys primary key is not tenant-scoped.");
  }

  await client.query(
    `insert into trust_keys (
       key_id, key_version, tenant_id, structure_version, identity_id, algorithm,
       public_key, public_key_encoding, purpose, scope_id, provider_type,
       provider_key_reference, status, valid_from, valid_until, status_changed_at,
       metadata, created_at
     ) values
       ('shared-logical-key', 1, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
        'testPublicKeyA', 'spki-der-base64url', 'audit_chain_signing', 'card-test',
        'kms', 'tenant-test/shared-logical-key/1', 'active', now(), null, now(), '{}'::jsonb, now()),
       ('shared-logical-key', 1, 'tenant-other', '1', 'trust-identity-other', 'Ed25519',
        'testPublicKeyB', 'spki-der-base64url', 'audit_chain_signing', 'card-test',
        'kms', 'tenant-other/shared-logical-key/1', 'active', now(), null, now(), '{}'::jsonb, now()),
       ('tenant-test-only-key', 1, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
        'testPublicKeyC', 'spki-der-base64url', 'settings_signing', 'settings-scope',
        'kms', 'tenant-test/only/1', 'active', now(), null, now(), '{}'::jsonb, now()),
       ('tenant-test-audit-only-key', 1, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
        'testPublicKeyAuditOnly', 'spki-der-base64url', 'audit_chain_signing', 'audit-only-scope',
        'kms', 'tenant-test/audit-only/1', 'active', now(), null, now(), '{}'::jsonb, now()),
       ('tenant-other-valid-key', 1, 'tenant-other', '1', 'trust-identity-other', 'Ed25519',
        'testPublicKeyD', 'spki-der-base64url', 'settings_signing', 'settings-scope',
        'kms', 'tenant-other/valid/1', 'active', now(), null, now(), '{}'::jsonb, now()),
       ('shared-state-key', 1, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
        'testPublicKeyF', 'spki-der-base64url', 'verification_only', 'state-scope',
        'kms', 'tenant-test/state/1', 'active', now(), null, now(), '{}'::jsonb, now()),
       ('shared-state-key', 1, 'tenant-other', '1', 'trust-identity-other', 'Ed25519',
        'testPublicKeyG', 'spki-der-base64url', 'verification_only', 'state-scope',
        'kms', 'tenant-other/state/1', 'active', now(), null, now(), '{}'::jsonb, now())`
  );

  await client.query(
    `insert into trust_keys (
       key_id, key_version, tenant_id, structure_version, identity_id, algorithm,
       public_key, public_key_encoding, purpose, scope_id, provider_type,
       provider_key_reference, status, valid_from, valid_until, status_changed_at,
       revoked_at, metadata, created_at
     ) values (
       'revoked-key', 1, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
       'testPublicKeyE', 'spki-der-base64url', 'settings_signing', 'revoked-scope',
       'kms', 'tenant-test/revoked/1', 'revoked', now(), null,
       timestamp '2026-07-17 10:00:00+00', timestamp '2026-07-17 10:00:00+00', '{}'::jsonb, now()
     )`
  );

  await expectError("trust_key_duplicate_inside_tenant", async () => {
    await client.query(
      `insert into trust_keys (
         key_id, key_version, tenant_id, structure_version, identity_id, algorithm,
         public_key, public_key_encoding, purpose, scope_id, provider_type,
         provider_key_reference, status, valid_from, valid_until, status_changed_at,
         metadata, created_at
       ) values (
         'shared-logical-key', 1, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
         'testPublicKeyDuplicate', 'spki-der-base64url', 'audit_chain_signing', 'card-test',
         'kms', 'tenant-test/shared-logical-key/duplicate', 'active', now(), null, now(), '{}'::jsonb, now()
       )`
    );
  });

  await client.query(
    `update trust_keys
        set status = 'retiring', valid_until = now() + interval '1 minute', status_changed_at = now() + interval '1 minute'
      where tenant_id = 'tenant-test'
        and key_id = 'shared-logical-key'
        and key_version = 1`
  );
  await client.query(
    `insert into trust_keys (
       key_id, key_version, tenant_id, structure_version, identity_id, algorithm,
       public_key, public_key_encoding, purpose, scope_id, provider_type,
       provider_key_reference, status, valid_from, valid_until, status_changed_at,
       replaces_key_id, replaces_key_version, metadata, created_at
     ) values (
       'shared-logical-key', 2, 'tenant-test', '1', 'trust-identity-test', 'Ed25519',
       'testPublicKeyRotation', 'spki-der-base64url', 'audit_chain_signing', 'card-test',
       'kms', 'tenant-test/shared-logical-key/2', 'pending', now(), null, now() + interval '2 minutes',
       'shared-logical-key', 1, '{}'::jsonb, now()
     )`
  );

  await expectError("trust_key_cross_tenant_rotation", async () => {
    await client.query(
      `insert into trust_keys (
         key_id, key_version, tenant_id, structure_version, identity_id, algorithm,
         public_key, public_key_encoding, purpose, scope_id, provider_type,
         provider_key_reference, status, valid_from, valid_until, status_changed_at,
         replaces_key_id, replaces_key_version, metadata, created_at
       ) values (
         'tenant-other-rotation', 2, 'tenant-other', '1', 'trust-identity-other', 'Ed25519',
         'testPublicKeyCrossRotation', 'spki-der-base64url', 'settings_signing', 'settings-scope',
         'kms', 'tenant-other/cross-rotation/2', 'pending', now(), null, now(),
         'tenant-test-only-key', 1, '{}'::jsonb, now()
       )`
    );
  });

  await client.query(
    `insert into trust_key_revocations (
       revocation_id, tenant_id, key_id, key_version, revocation_type, reason_code,
       effective_at, recorded_at, actor_identity_id, idempotency_key
     ) values (
       'revocation-valid', 'tenant-test', 'revoked-key', 1, 'revoked', 'KEY_REVOKED',
       timestamp '2026-07-17 10:00:00+00', timestamp '2026-07-17 10:00:00+00', 'trust-identity-test', 'revocation-valid'
     )`
  );

  await expectError("trust_key_cross_tenant_revocation", async () => {
    await client.query(
      `insert into trust_key_revocations (
         revocation_id, tenant_id, key_id, key_version, revocation_type, reason_code,
         effective_at, recorded_at, actor_identity_id, idempotency_key
       ) values (
         'revocation-cross-tenant', 'tenant-other', 'tenant-test-only-key', 1, 'revoked', 'KEY_REVOKED',
         now(), now(), 'trust-identity-other', 'revocation-cross-tenant'
       )`
    );
  });

  await client.query(
    `insert into trust_signed_actions (
       action_id, tenant_id, structure_version, actor_identity_id, action_type,
       target_id, idempotency_key, schema_version, payload, metadata, key_id,
       key_version, key_purpose, signature_algorithm, signed_at, signature
     ) values (
       'action-valid', 'tenant-test', '1', 'trust-identity-test', 'settings.publish',
       'card-test', 'action-valid', 'settings-action-1', '{}'::jsonb, '{}'::jsonb,
       'tenant-test-only-key', 1, 'settings_signing', 'Ed25519', now(), 'testSignature'
     )`
  );

  await expectError("trust_key_cross_tenant_signed_action", async () => {
    await client.query(
      `insert into trust_signed_actions (
         action_id, tenant_id, structure_version, actor_identity_id, action_type,
         target_id, idempotency_key, schema_version, payload, metadata, key_id,
         key_version, key_purpose, signature_algorithm, signed_at, signature
       ) values (
         'action-cross-tenant', 'tenant-other', '1', 'trust-identity-other', 'settings.publish',
         'card-test', 'action-cross-tenant', 'settings-action-1', '{}'::jsonb, '{}'::jsonb,
         'tenant-test-only-key', 1, 'settings_signing', 'Ed25519', now(), 'testSignature'
       )`
    );
  });

  await client.query(
    `insert into cryptographic_envelopes (
       envelope_id, tenant_id, structure_version, envelope_version, card_id, artifact_type,
       artifact_id, artifact_version, domain, schema_version, canonicalization_version,
       algorithm_policy_version, digest_algorithm, digest, signature_algorithm, key_id,
       key_version, key_purpose, signer_type, signer_id, signed_at, metadata, status,
       payload, signature
     ) values (
       'envelope-valid', 'tenant-test', '1', '1', 'card-test', 'settings_snapshot',
       'settings-artifact', '1', 'settings.snapshot', 'settings-schema-1', 'bidayax-c14n-1',
       'trust-algorithm-policy-1', 'SHA-256', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
       'Ed25519', 'tenant-test-only-key', 1, 'settings_signing', 'tenant', 'trust-identity-test',
       now(), '{}'::jsonb, 'active', '{}'::jsonb, 'testSignature'
     )`
  );

  await expectError("trust_key_cross_tenant_envelope", async () => {
    await client.query(
      `insert into cryptographic_envelopes (
         envelope_id, tenant_id, structure_version, envelope_version, card_id, artifact_type,
         artifact_id, artifact_version, domain, schema_version, canonicalization_version,
         algorithm_policy_version, digest_algorithm, digest, signature_algorithm, key_id,
         key_version, key_purpose, signer_type, signer_id, signed_at, metadata, status,
         payload, signature
       ) values (
         'envelope-cross-tenant', 'tenant-other', '1', '1', null, 'settings_snapshot',
         'settings-artifact-cross', '1', 'settings.snapshot', 'settings-schema-1', 'bidayax-c14n-1',
         'trust-algorithm-policy-1', 'SHA-256', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
         'Ed25519', 'tenant-test-only-key', 1, 'settings_signing', 'tenant', 'trust-identity-other',
         now(), '{}'::jsonb, 'active', '{}'::jsonb, 'testSignature'
       )`
    );
  });

  await client.query(
    `update trust_keys
        set status = 'compromised', compromised_at = now() + interval '3 minutes', status_changed_at = now() + interval '3 minutes'
      where tenant_id = 'tenant-test'
        and key_id = 'shared-state-key'
        and key_version = 1`
  );
  const otherTenantState = await client.query<{ status: string }>(
    `select status from trust_keys where tenant_id = 'tenant-other' and key_id = 'shared-state-key' and key_version = 1`
  );
  if (otherTenantState.rows[0]?.status !== "active") {
    throw new Error("Compromise state leaked across tenants for same logical key.");
  }

  await expectError("trust_merkle_root_cross_tenant_key", async () => {
    await client.query(
      `insert into trust_merkle_batches (
         batch_id, tenant_id, structure_version, leaf_digests, leaf_count, root_digest,
         digest_algorithm, duplicate_policy, odd_node_policy, root_key_id, root_key_version,
         root_key_purpose, root_signature_algorithm, root_signature_operation, root_signature,
         root_signed_at, created_at
       ) values (
         'batch-cross-tenant-root-key', 'tenant-other', '1',
         '["eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"]'::jsonb,
         1, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
         'SHA-256', 'reject', 'duplicate_last', 'tenant-test-audit-only-key', 1,
         'audit_chain_signing', 'Ed25519', 'signature', 'testSignature', now(), now()
       )`
    );
  });


  await client.query(
    `insert into trust_merkle_batches (
       batch_id, tenant_id, structure_version, leaf_digests, leaf_count, root_digest,
       digest_algorithm, duplicate_policy, odd_node_policy, created_at
     ) values (
       'batch-trust-test', 'tenant-test', '1',
       '["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]'::jsonb,
       2, 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
       'SHA-256', 'reject', 'duplicate_last', now()
     )`
  );

  await client.query(
    `insert into trust_merkle_proofs (
       proof_id, tenant_id, structure_version, proof_version, batch_id, leaf_index,
       leaf_digest, root_digest, digest_algorithm, proof_steps, idempotency_key, created_at
     ) values (
       'proof-trust-test', 'tenant-test', '1', '1', 'batch-trust-test', 0,
       'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
       'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
       'SHA-256',
       '[{"position":"right","siblingDigest":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}]'::jsonb,
       'proof-idempotency-test', now()
     )`
  );

  await expectError("trust_merkle_duplicate_proof", async () => {
    await client.query(
      `insert into trust_merkle_proofs (
         proof_id, tenant_id, structure_version, proof_version, batch_id, leaf_index,
         leaf_digest, root_digest, digest_algorithm, proof_steps, idempotency_key, created_at
       ) values (
         'proof-trust-duplicate', 'tenant-test', '1', '1', 'batch-trust-test', 0,
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
         'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
         'SHA-256', '[]'::jsonb, 'proof-idempotency-duplicate', now()
       )`
    );
  });

  await expectError("trust_merkle_root_mismatch", async () => {
    await client.query(
      `insert into trust_merkle_proofs (
         proof_id, tenant_id, structure_version, proof_version, batch_id, leaf_index,
         leaf_digest, root_digest, digest_algorithm, proof_steps, idempotency_key, created_at
       ) values (
         'proof-trust-root-mismatch', 'tenant-test', '1', '1', 'batch-trust-test', 1,
         'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
         'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
         'SHA-256', '[]'::jsonb, 'proof-idempotency-root-mismatch', now()
       )`
    );
  });

  await expectError("trust_merkle_cross_tenant", async () => {
    await client.query(
      `insert into trust_merkle_proofs (
         proof_id, tenant_id, structure_version, proof_version, batch_id, leaf_index,
         leaf_digest, root_digest, digest_algorithm, proof_steps, idempotency_key, created_at
       ) values (
         'proof-trust-cross-tenant', 'tenant-other', '1', '1', 'batch-trust-test', 1,
         'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
         'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
         'SHA-256', '[]'::jsonb, 'proof-idempotency-cross-tenant', now()
       )`
    );
  });

  await expectError("trust_merkle_negative_leaf_index", async () => {
    await client.query(
      `insert into trust_merkle_proofs (
         proof_id, tenant_id, structure_version, proof_version, batch_id, leaf_index,
         leaf_digest, root_digest, digest_algorithm, proof_steps, idempotency_key, created_at
       ) values (
         'proof-trust-negative', 'tenant-test', '1', '1', 'batch-trust-test', -1,
         'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
         'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
         'SHA-256', '[]'::jsonb, 'proof-idempotency-negative', now()
       )`
    );
  });

  await expectError("trust_merkle_proof_mutation", async () => {
    await client.query(
      `update trust_merkle_proofs
          set proof_steps = '[]'::jsonb
        where proof_id = 'proof-trust-test'`
    );
  });
  await client.query("ROLLBACK");
  finish("passed", [
    `complete migration chain applied inside a transaction (${migrationFiles.length} files)`,
    "settings tables exist",
    "identity tables exist",
    "telephony domain tables exist",
    "telephony tenant/card mismatch inserts rejected",
    "telephony usage ledger is append-only",
    "telephony audit events are append-only",
    "telephony command idempotency keys reject duplicates",
    "identity provider subject uniqueness enforced",
    "cross-tenant card grants rejected",
    "membership revocation terminates application sessions",
    "revoked memberships cannot create sessions",
    "identity audit events are append-only",
    "provider webhook replay is rejected",
    "tenant/card mismatch inserts rejected",
    "tenant/card mismatch updates rejected",
    "duplicate active published version rejected",
    "published version mutation rejected",
    "audit event mutation rejected",
    "idempotency key conflict rejected",
    "trust keys are tenant-scoped across primary keys, rotation, revocation, signatures, envelopes, and Merkle roots",
    "trust Merkle proofs are tenant-bound, immutable, and duplicate-safe"
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
