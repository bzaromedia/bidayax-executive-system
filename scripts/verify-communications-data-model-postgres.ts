import { execFileSync, spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import pg from "pg";
import type { Client as PgClient } from "pg";

const { Client } = pg;
const databaseUrl = process.env.COMMUNICATIONS_DATA_MODEL_TEST_DATABASE_URL;
const dockerExecutable = process.platform === "win32" ? "docker.exe" : "docker";
const containerName = `exec-card-communications-pg17-${process.pid}-${Date.now()}`;
const disposableDatabaseName = "bidayax_phase11b_test";
let disposableHostPort: string | null = null;
let disposableContainerStarted = false;

type VerificationStatus = "passed" | "failed" | "blocked";

function finish(status: VerificationStatus, details: readonly string[]): never {
  const output = {
    component: "communications-data-model-postgres-verifier",
    details,
    event: "communications_data_model_postgres_verification_completed",
    status
  };

  const line = JSON.stringify(output);

  if (status === "passed") {
    console.info(line);
    process.exit(0);
  }

  console.error(line);
  process.exit(1);
}

function safeDatabaseUrl(url: string) {
  const parsedUrl = new URL(url);
  const databaseName = parsedUrl.pathname.replace(/^\//, "");

  if (!/test|ci|local/i.test(databaseName)) {
    finish("failed", [
      `Refusing to run against database '${databaseName}'. Use a disposable database name containing test, ci, or local.`
    ]);
  }

  return url;
}

function dockerIsLocal() {
  if (process.env.DOCKER_HOST && process.env.DOCKER_HOST.trim().length > 0) {
    return false;
  }

  const version = spawnSync(dockerExecutable, ["version"], { stdio: "ignore" });
  if (version.status !== 0) {
    return false;
  }

  const context = spawnSync(dockerExecutable, ["context", "show"], {
    encoding: "utf8"
  });
  if (context.status !== 0) {
    return false;
  }

  return ["default", "desktop-linux"].includes(context.stdout.trim());
}

function disposableConnectionString() {
  if (!disposableHostPort) {
    throw new Error("Disposable PostgreSQL port was not assigned.");
  }

  return `postgres://postgres:postgres@127.0.0.1:${disposableHostPort}/${disposableDatabaseName}`;
}

function inspectDisposableHostPort() {
  const output = execFileSync(
    dockerExecutable,
    ["port", containerName, "5432/tcp"],
    { encoding: "utf8" }
  ).trim();
  const port =
    output.match(/127\.0\.0\.1:(\d+)$/)?.[1] ??
    output.match(/0\.0\.0\.0:(\d+)$/)?.[1];

  if (!port) {
    throw new Error(
      `Unable to determine local PostgreSQL port from Docker output: ${output}`
    );
  }

  disposableHostPort = port;
}

async function waitForDatabaseReady(connectionString: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const client = new Client({ connectionString });
      await client.connect();
      await client.end();
      return;
    } catch {
      await delay(1000);
    }
  }

  throw new Error("Timed out waiting for disposable PostgreSQL 17.");
}

async function resolveConnectionString() {
  if (databaseUrl) {
    return safeDatabaseUrl(databaseUrl);
  }

  if (!dockerIsLocal()) {
    finish("blocked", [
      "COMMUNICATIONS_DATA_MODEL_TEST_DATABASE_URL is not configured and local Docker PostgreSQL is unavailable.",
      "Provide a disposable test database URL or enable local Docker using the default or desktop-linux context."
    ]);
  }

  execFileSync(
    dockerExecutable,
    [
      "run",
      "--rm",
      "--name",
      containerName,
      "-d",
      "-e",
      "POSTGRES_PASSWORD=postgres",
      "-e",
      `POSTGRES_DB=${disposableDatabaseName}`,
      "-p",
      "127.0.0.1::5432",
      "postgres:17-alpine"
    ],
    { stdio: "ignore" }
  );
  disposableContainerStarted = true;
  inspectDisposableHostPort();

  const connectionString = disposableConnectionString();
  await waitForDatabaseReady(connectionString);
  return connectionString;
}

async function applyMigrations(client: PgClient) {
  const migrationsDirectory = join(process.cwd(), "database", "migrations");
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();

  for (const file of migrationFiles) {
    const sql = await readFile(join(migrationsDirectory, file), "utf8");
    await client.query(sql);
  }

  return migrationFiles;
}

async function expectError(
  client: PgClient,
  label: string,
  action: () => Promise<void>
) {
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

async function seedFoundation(client: PgClient) {
  await client.query(
    `insert into tenants (tenant_id, company_name, owner_email, status, created_at, updated_at)
     values
       ('tenant-test', 'Test Tenant', 'owner@example.test', 'active', now(), now()),
       ('tenant-other', 'Other Tenant', 'owner-other@example.test', 'active', now(), now())`
  );
  await client.query(
    `insert into brand_assets (asset_id, tenant_id, asset_type, storage_path, alt_text, mime_type, checksum_sha256, created_at)
     values
       ('asset-test', 'tenant-test', 'logo', '/test/logo.svg', 'Logo', 'image/svg+xml', repeat('a', 64), now()),
       ('asset-other', 'tenant-other', 'logo', '/test/other-logo.svg', 'Logo', 'image/svg+xml', repeat('b', 64), now())`
  );
  await client.query(
    `insert into tenant_brand_profiles (
       tenant_id, company_name, logo_asset_id, favicon_asset_id, primary_color,
       secondary_color, accent_color, background_color, text_color, font_family,
       button_radius, card_radius, motion_intensity, contrast_mode, created_at, updated_at
     ) values
       ('tenant-test', 'Test Tenant', 'asset-test', 'asset-test', '#D4AF37',
        '#1A1A1A', '#D4AF37', '#111111', '#FFFFFF', 'Inter',
        '8px', '12px', 'standard', 'standard', now(), now()),
       ('tenant-other', 'Other Tenant', 'asset-other', 'asset-other', '#D4AF37',
        '#1A1A1A', '#D4AF37', '#111111', '#FFFFFF', 'Inter',
        '8px', '12px', 'standard', 'standard', now(), now())`
  );
  await client.query(
    `insert into executive_card_profiles (
       card_id, tenant_id, executive_name, title, company, bio, profile_image_asset_id,
       phone, email, website, calendar_url, location, social_links, primary_cta,
       secondary_cta, qr_destination_mode, published_version, draft_version, status
     ) values
       ('card-test', 'tenant-test', 'Test Executive', 'Founder', 'Test Tenant',
        'Bio', 'asset-test', '+15555550100', 'exec@example.test', 'https://example.test',
        'https://example.test/calendar', 'Test City', '[]'::jsonb,
        '{"label":"Call","type":"call","destination":"tel:+15555550100","visible":true}'::jsonb,
        '{"label":"Email","type":"email","destination":"mailto:exec@example.test","visible":true}'::jsonb,
        'card_profile', null, null, 'draft'),
       ('card-other', 'tenant-test', 'Other Executive', 'Founder', 'Test Tenant',
        'Bio', 'asset-test', '+15555550101', 'other@example.test', 'https://example.test',
        'https://example.test/calendar', 'Test City', '[]'::jsonb,
        '{"label":"Call","type":"call","destination":"tel:+15555550101","visible":true}'::jsonb,
        '{"label":"Email","type":"email","destination":"mailto:other@example.test","visible":true}'::jsonb,
        'card_profile', null, null, 'draft'),
       ('card-tenant-other', 'tenant-other', 'Other Tenant Executive', 'Founder', 'Other Tenant',
        'Bio', 'asset-other', '+15555550102', 'exec-other@example.test', 'https://other.example.test',
        'https://other.example.test/calendar', 'Test City', '[]'::jsonb,
        '{"label":"Call","type":"call","destination":"tel:+15555550102","visible":true}'::jsonb,
        '{"label":"Email","type":"email","destination":"mailto:exec-other@example.test","visible":true}'::jsonb,
        'card_profile', null, null, 'draft')`
  );
  await client.query(
    `insert into user_identities (
       user_id, provider, provider_subject, email, normalized_email,
       email_verified, display_name, status, created_at, updated_at, last_authenticated_at
     ) values
       ('user-test', 'workos', 'provider-user-test', 'identity@example.test',
        'identity@example.test', true, 'Identity Tester', 'active', now(), now(), now()),
       ('user-other', 'workos', 'provider-user-other', 'other-identity@example.test',
        'other-identity@example.test', true, 'Other Identity Tester', 'active', now(), now(), now()),
       ('user-revoked', 'workos', 'provider-user-revoked', 'revoked@example.test',
        'revoked@example.test', true, 'Revoked Tester', 'active', now(), now(), now())`
  );
  await client.query(
    `insert into tenant_memberships (
       membership_id, tenant_id, user_id, role, status, created_at, updated_at, revoked_at
     ) values
       ('membership-test', 'tenant-test', 'user-test', 'tenant_admin', 'active', now(), now(), null),
       ('membership-other', 'tenant-other', 'user-other', 'tenant_admin', 'active', now(), now(), null),
       ('membership-revoked', 'tenant-test', 'user-revoked', 'tenant_admin', 'revoked', now(), now(), now())`
  );
  await client.query(
    `insert into card_access_grants (
       grant_id, tenant_id, card_id, user_id, permission_set, created_at, expires_at, revoked_at
     ) values
       ('grant-test', 'tenant-test', 'card-test', 'user-test', '["communications:write"]'::jsonb, now(), now() + interval '1 day', null)`
  );
  await client.query(
    `insert into application_sessions (
       session_id, session_token_hash, csrf_token_hash, user_id, tenant_id,
       provider, provider_session_id, authentication_method, created_at,
       last_seen_at, idle_expires_at, absolute_expires_at, revoked_at
     ) values
       ('session-test', repeat('c', 64), repeat('d', 64), 'user-test', 'tenant-test',
        'workos', 'provider-session-test', 'Passkey', now(), now(),
        now() + interval '30 minutes', now() + interval '8 hours', null),
       ('session-revoked', repeat('e', 64), repeat('f', 64), 'user-test', 'tenant-test',
        'workos', 'provider-session-revoked', 'Passkey', now(), now(),
        now() + interval '30 minutes', now() + interval '8 hours', now()),
       ('session-other', repeat('1', 64), repeat('2', 64), 'user-other', 'tenant-other',
        'workos', 'provider-session-other', 'Passkey', now(), now(),
        now() + interval '30 minutes', now() + interval '8 hours', null)`
  );
}

async function seedCommunications(client: PgClient) {
  await client.query(
    `insert into communication_participants (
       participant_id, tenant_id, card_id, kind, display_name_hash, locale,
       trust_reference_id, created_at, updated_at
     ) values
       ('participant-test', 'tenant-test', 'card-test', 'external_contact', repeat('a', 64), 'en-US', null, now(), now()),
       ('participant-other-card', 'tenant-test', 'card-other', 'external_contact', repeat('b', 64), 'en-US', null, now(), now()),
       ('participant-other-tenant', 'tenant-other', 'card-tenant-other', 'external_contact', repeat('c', 64), 'en-US', null, now(), now())`
  );
  await client.query(
    `insert into communication_participant_endpoints (
       endpoint_id, tenant_id, card_id, participant_id, channel, endpoint_value_hash,
       normalized_hint, verification_state, created_at, updated_at
     ) values (
       'endpoint-test', 'tenant-test', 'card-test', 'participant-test',
       'telephony', repeat('d', 64), 'redacted-channel', 'verified', now(), now()
     )`
  );
  await client.query(
    `insert into communication_consent_policies (
       consent_policy_id, tenant_id, card_id, policy_version, jurisdiction,
       channel, purpose, disclosure_required, recording_allowed,
       transcription_allowed, retention_class, effective_at, expires_at
     ) values
       ('consent-policy-test', 'tenant-test', 'card-test', 'communications-consent-v1',
        'US', 'telephony', 'callback', true, false, false, 'consent',
        now() - interval '3 days', null),
       ('consent-policy-other-card', 'tenant-test', 'card-other', 'communications-consent-v1',
        'US', 'telephony', 'callback', true, false, false, 'consent',
        now() - interval '3 days', null),
       ('consent-policy-scheduling', 'tenant-test', 'card-test', 'communications-consent-v1',
        'US', 'scheduling', 'scheduling', true, false, false, 'consent',
        now() - interval '3 days', null)`
  );
  await client.query(
    `insert into communication_consent_receipts (
       consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
       channel, purpose, status, source, evidence_reference_id, observed_at,
       effective_at, expires_at, revoked_at, metadata
     ) values
       ('consent-granted', 'tenant-test', 'card-test', 'participant-test',
        'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
        'evidence-consent-granted', now() - interval '1 hour',
        now() - interval '1 hour', null, null, '{"reasonCode":"CONSENT_GRANTED"}'::jsonb),
       ('consent-expired', 'tenant-test', 'card-test', 'participant-test',
        'consent-policy-test', 'telephony', 'callback', 'expired', 'visitor',
        'evidence-consent-expired', now() - interval '2 days',
        now() - interval '2 days', now() - interval '1 day', null, '{"reasonCode":"CONSENT_EXPIRED"}'::jsonb)`
  );
  await client.query(
    `insert into communications (
       communication_id, tenant_id, card_id, structure_version, channel,
       direction, current_state, state_version, request_reason,
       data_classification, retention_class, adapter_reference_id, metadata,
       created_at, updated_at
     ) values
       ('communication-test', 'tenant-test', 'card-test', '1', 'telephony',
        'outbound', 'requested', 0, 'callback_requested',
        'internal_operational_metadata', 'operational', null, '{}'::jsonb,
        now(), now()),
       ('communication-terminal', 'tenant-test', 'card-test', '1', 'telephony',
        'outbound', 'completed', 0, 'callback_completed',
        'internal_operational_metadata', 'operational', null, '{}'::jsonb,
        now(), now())`
  );
  await client.query(
    `insert into communication_command_idempotency_keys (
       tenant_id, card_id, operation, idempotency_key, request_hash,
       result_communication_id, actor_user_id, session_id, card_grant_id,
       authorization_decision_id, permission_version, policy_version, status,
       created_at, completed_at, expires_at
     ) values (
       'tenant-test', 'card-test', 'request_callback', 'command-test',
       repeat('e', 64), 'communication-test', 'user-test', 'session-test',
       'grant-test', 'authz-allow', 'communications-permissions-v1',
       'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
     )`
  );
  await client.query(
    `insert into communication_lifecycle_transitions (
       transition_id, tenant_id, card_id, communication_id, sequence_number,
       from_state, to_state, reason_code, actor_user_id,
       authorization_decision_id, occurred_at, metadata
     ) values (
       'transition-test', 'tenant-test', 'card-test', 'communication-test', 1,
       'requested', 'policy_checking', 'CONSENT_CHECK_STARTED', 'user-test',
       'authz-allow', now(), '{}'::jsonb
     )`
  );
  await client.query(
    `insert into communication_audit_events (
       audit_event_id, tenant_id, card_id, communication_id, event_type,
       actor_type, actor_user_id, authorization_decision_id, permission_version,
       policy_version, result, reason_code, occurred_at, metadata
     ) values (
       'audit-test', 'tenant-test', 'card-test', 'communication-test',
       'communication.policy_checking', 'user', 'user-test', 'authz-allow',
       'communications-permissions-v1', 'communications-policy-v1',
       'succeeded', 'CONSENT_CHECK_STARTED', now(), '{"safe":true}'::jsonb
     )`
  );
}

async function runVerification(client: PgClient, migrationFiles: readonly string[]) {
  const tableCheck = await client.query<{ table_name: string }>(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'communications',
          'communication_participants',
          'communication_participant_endpoints',
          'communication_consent_policies',
          'communication_consent_receipts',
          'communication_suppressions',
          'communication_lifecycle_transitions',
          'communication_command_idempotency_keys',
          'communication_dispatch_attempts',
          'communication_webhook_evidence',
          'communication_routing_policies',
          'communication_receptionist_sessions',
          'communication_adapter_health',
          'communication_trust_evidence_references',
          'communication_audit_events'
        )
      order by table_name`
  );

  if (tableCheck.rowCount !== 15) {
    throw new Error(
      `Expected 15 Communications data-model tables, found ${tableCheck.rowCount ?? 0}.`
    );
  }

  await seedFoundation(client);
  await seedCommunications(client);

  const state = await client.query<{ current_state: string; state_version: number }>(
    `select current_state, state_version
       from communications
      where communication_id = 'communication-test'`
  );
  if (
    state.rows[0]?.current_state !== "policy_checking" ||
    state.rows[0]?.state_version !== 1
  ) {
    throw new Error("Lifecycle transition did not advance the communication state.");
  }

  await client.query(
    `insert into communication_dispatch_attempts (
       attempt_id, tenant_id, card_id, communication_id, participant_id,
       purpose, consent_receipt_id, suppression_id, command_operation,
       command_idempotency_key, adapter_id, channel, state, retry_count,
       provider_dispatch_enabled, provider_reference_id, failure_reason_code,
       next_retry_at, created_at, updated_at
     ) values (
       'dispatch-test', 'tenant-test', 'card-test', 'communication-test',
       'participant-test', 'callback', 'consent-granted', null,
       'request_callback', 'command-test', 'telephony-adapter-disabled',
       'telephony', 'queued', 0, false, null, null, null, now(), now()
     )`
  );
  await client.query(
    `insert into communication_dispatch_attempts (
       attempt_id, tenant_id, card_id, communication_id, participant_id,
       purpose, consent_receipt_id, suppression_id, command_operation,
       command_idempotency_key, adapter_id, channel, state, retry_count,
       provider_dispatch_enabled, provider_reference_id, failure_reason_code,
       next_retry_at, created_at, updated_at
     ) values (
       'dispatch-update-consent-test', 'tenant-test', 'card-test',
       'communication-test', 'participant-test', 'callback', null, null,
       'request_callback', 'command-test', 'telephony-adapter-disabled',
       'telephony', 'blocked', 0, false, null, 'CONSENT_MISSING', null,
       now(), now()
     )`
  );

  await expectError(client, "command_duplicate", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_communication_id, actor_user_id, session_id, card_grant_id,
         authorization_decision_id, permission_version, policy_version, status,
         created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'request_callback', 'command-test',
         repeat('f', 64), 'communication-test', 'user-test', 'session-test',
         'grant-test', 'authz-allow', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "forged_actor", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_communication_id, actor_user_id, session_id, card_grant_id,
         authorization_decision_id, permission_version, policy_version, status,
         created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'request_callback', 'command-forged',
         repeat('1', 64), 'communication-test', 'user-other', null,
         null, 'authz-deny', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "revoked_session", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_communication_id, actor_user_id, session_id, card_grant_id,
         authorization_decision_id, permission_version, policy_version, status,
         created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'request_callback', 'command-revoked-session',
         repeat('2', 64), 'communication-test', 'user-test', 'session-revoked',
         'grant-test', 'authz-deny', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "revoked_grant", async () => {
    await client.query(
      `update card_access_grants
          set revoked_at = now()
        where grant_id = 'grant-test'`
    );
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, operation, idempotency_key, request_hash,
         result_communication_id, actor_user_id, session_id, card_grant_id,
         authorization_decision_id, permission_version, policy_version, status,
         created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'request_callback', 'command-revoked-grant',
         repeat('3', 64), 'communication-test', 'user-test', 'session-test',
         'grant-test', 'authz-deny', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "endpoint_cross_card", async () => {
    await client.query(
      `insert into communication_participant_endpoints (
         endpoint_id, tenant_id, card_id, participant_id, channel,
         endpoint_value_hash, normalized_hint, verification_state, created_at, updated_at
       ) values (
         'endpoint-cross-card', 'tenant-test', 'card-other', 'participant-test',
         'telephony', repeat('4', 64), 'redacted-channel', 'verified', now(), now()
       )`
    );
  });

  await expectError(client, "endpoint_cross_tenant", async () => {
    await client.query(
      `insert into communication_participant_endpoints (
         endpoint_id, tenant_id, card_id, participant_id, channel,
         endpoint_value_hash, normalized_hint, verification_state, created_at, updated_at
       ) values (
         'endpoint-cross-tenant', 'tenant-other', 'card-tenant-other', 'participant-test',
         'telephony', repeat('5', 64), 'redacted-channel', 'verified', now(), now()
       )`
    );
  });

  await expectError(client, "endpoint_null_card_bypass", async () => {
    await client.query(
      `insert into communication_participant_endpoints (
         endpoint_id, tenant_id, card_id, participant_id, channel,
         endpoint_value_hash, normalized_hint, verification_state, created_at, updated_at
       ) values (
         'endpoint-null-card', 'tenant-test', null, 'participant-test',
         'telephony', repeat('9', 64), 'redacted-channel', 'verified', now(), now()
       )`
    );
  });

  await expectError(client, "consent_null_card_bypass", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-null-card', 'tenant-test', null, 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-null-card', now(), now(), null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "consent_policy_cross_card", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-cross-card-policy', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-other-card', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-cross-card-policy', now(), now(), null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "consent_policy_purpose_channel_mismatch", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-purpose-policy-mismatch', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-scheduling', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-purpose-policy-mismatch', now(), now(), null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "suppression_null_card_bypass", async () => {
    await client.query(
      `insert into communication_suppressions (
         suppression_id, tenant_id, card_id, participant_id, channel, purpose,
         status, reason_code, created_by_actor_id, released_by_actor_id,
         created_at, expires_at, released_at, release_reason, audit_event_id
       ) values (
         'suppression-null-card', 'tenant-test', null, 'participant-test',
         'telephony', 'callback', 'active', 'NULL_CARD_BYPASS', 'user-test',
         null, now(), now() + interval '1 day', null, null, null
       )`
    );
  });

  await expectError(client, "invalid_transition", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-invalid', 'tenant-test', 'card-test', 'communication-test', 2,
         'policy_checking', 'active', 'INVALID_SKIP', 'user-test',
         'authz-deny', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "lifecycle_null_card_bypass", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-null-card', 'tenant-test', null, 'communication-test', 2,
         'policy_checking', 'authorized', 'NULL_CARD_BYPASS', 'user-test',
         'authz-deny', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "terminal_reentry", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-terminal-reentry', 'tenant-test', 'card-test',
         'communication-terminal', 1, 'completed', 'active', 'TERMINAL_REENTRY',
         'user-test', 'authz-deny', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "lifecycle_cross_card", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-cross-card', 'tenant-test', 'card-other',
         'communication-test', 2, 'policy_checking', 'authorized',
         'CARD_MISMATCH', 'user-test', 'authz-deny', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "dispatch_null_card_bypass", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-null-card', 'tenant-test', null, 'communication-test',
         'participant-test', 'callback', null, null, 'request_callback',
         'command-test', 'telephony-adapter-disabled', 'telephony', 'blocked', 0,
         false, null, 'NULL_CARD_BYPASS', null, now(), now()
       )`
    );
  });

  await expectError(client, "dispatch_missing_consent", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-missing-consent', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', null, null, 'request_callback',
         'command-test', 'telephony-adapter-disabled', 'telephony', 'queued', 0,
         false, null, null, null, now(), now()
      )`
    );
  });

  await expectError(client, "dispatch_update_missing_consent", async () => {
    await client.query(
      `update communication_dispatch_attempts
          set state = 'queued',
              failure_reason_code = null,
              updated_at = now()
        where attempt_id = 'dispatch-update-consent-test'`
    );
  });

  await expectError(client, "dispatch_expired_consent", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-expired-consent', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', 'consent-expired', null, 'request_callback',
         'command-test', 'telephony-adapter-disabled', 'telephony', 'queued', 0,
         false, null, null, null, now(), now()
       )`
    );
  });

  await expectError(client, "dispatch_ambiguous_consent", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-ambiguous', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-ambiguous', now(), now(), null, null,
         '{"reasonCode":"CONSENT_GRANTED_DUPLICATE"}'::jsonb
       )`
    );
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-ambiguous-consent', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', 'consent-granted', null, 'request_callback',
         'command-test', 'telephony-adapter-disabled', 'telephony', 'queued', 0,
         false, null, null, null, now(), now()
      )`
    );
  });

  await expectError(client, "dispatch_update_suppressed", async () => {
    await client.query(
      `insert into communication_suppressions (
         suppression_id, tenant_id, card_id, participant_id, channel, purpose,
         status, reason_code, created_by_actor_id, released_by_actor_id,
         created_at, expires_at, released_at, release_reason, audit_event_id
       ) values (
         'suppression-update-test', 'tenant-test', 'card-test', 'participant-test',
         'telephony', 'callback', 'active', 'USER_SUPPRESSED', 'user-test',
         null, now(), now() + interval '1 day', null, null, 'audit-test'
       )`
    );
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-update-suppression-test', 'tenant-test', 'card-test',
         'communication-test', 'participant-test', 'callback', 'consent-granted',
         null, 'request_callback', 'command-test', 'telephony-adapter-disabled',
         'telephony', 'blocked', 0, false, null, 'SUPPRESSED', null, now(), now()
       )`
    );
    await client.query(
      `update communication_dispatch_attempts
          set state = 'queued',
              failure_reason_code = null,
              updated_at = now()
        where attempt_id = 'dispatch-update-suppression-test'`
    );
  });

  await client.query(
    `insert into communication_consent_receipts (
       consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
       channel, purpose, status, source, evidence_reference_id, observed_at,
       effective_at, expires_at, revoked_at, metadata
     ) values (
       'consent-revoked', 'tenant-test', 'card-test', 'participant-test',
       'consent-policy-test', 'telephony', 'callback', 'revoked', 'visitor',
       'evidence-consent-revoked', now(), now(), null, now(), '{"reasonCode":"CONSENT_REVOKED"}'::jsonb
     )`
  );

  await expectError(client, "dispatch_revoked_consent", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-revoked-consent', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', 'consent-granted', null, 'request_callback',
         'command-test', 'telephony-adapter-disabled', 'telephony', 'queued', 0,
         false, null, null, null, now() + interval '1 second', now() + interval '1 second'
       )`
    );
  });

  await client.query(
    `insert into communication_suppressions (
       suppression_id, tenant_id, card_id, participant_id, channel, purpose,
       status, reason_code, created_by_actor_id, released_by_actor_id,
       created_at, expires_at, released_at, release_reason, audit_event_id
     ) values (
       'suppression-test', 'tenant-test', 'card-test', 'participant-test',
       'telephony', 'callback', 'active', 'USER_SUPPRESSED', 'user-test',
       null, now(), now() + interval '1 day', null, null, 'audit-test'
     )`
  );

  await expectError(client, "dispatch_suppressed", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-suppressed', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', 'consent-granted', 'suppression-test',
         'request_callback', 'command-test', 'telephony-adapter-disabled',
         'telephony', 'queued', 0, false, null, null, null,
         now() + interval '1 second', now() + interval '1 second'
       )`
    );
  });

  await expectError(client, "dispatch_provider_enabled", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-provider-enabled', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', 'consent-granted', null,
         'request_callback', 'command-test', 'telephony-adapter-disabled',
         'telephony', 'blocked', 0, true, null, 'PROVIDER_DISABLED', null,
         now(), now()
       )`
    );
  });

  await client.query(
    `insert into communication_webhook_evidence (
       webhook_evidence_id, tenant_id, card_id, communication_id, channel,
       provider_account_reference, provider_event_id, payload_hash,
       signature_verified, durable_payload_retention_enabled, sanitized_metadata,
       received_at, recorded_at
     ) values (
       'webhook-test', 'tenant-test', 'card-test', 'communication-test',
       'telephony', 'provider-account-redacted', 'provider-event-test',
       repeat('6', 64), true, false, '{"reasonCode":"WEBHOOK_VERIFIED"}'::jsonb,
       now(), now()
     )`
  );

  await expectError(client, "webhook_null_card_bypass", async () => {
    await client.query(
      `insert into communication_webhook_evidence (
         webhook_evidence_id, tenant_id, card_id, communication_id, channel,
         provider_account_reference, provider_event_id, payload_hash,
         signature_verified, durable_payload_retention_enabled, sanitized_metadata,
         received_at, recorded_at
       ) values (
         'webhook-null-card', 'tenant-test', null, 'communication-test',
         'telephony', 'provider-account-redacted', 'provider-event-null-card',
         repeat('7', 64), true, false, '{}'::jsonb, now(), now()
       )`
    );
  });

  await expectError(client, "webhook_raw_body", async () => {
    await client.query(
      `insert into communication_webhook_evidence (
         webhook_evidence_id, tenant_id, card_id, communication_id, channel,
         provider_account_reference, provider_event_id, payload_hash,
       signature_verified, durable_payload_retention_enabled, sanitized_metadata,
         received_at, recorded_at
       ) values (
         'webhook-raw-body', 'tenant-test', 'card-test', 'communication-test',
         'telephony', 'provider-account-redacted', 'provider-event-raw',
         repeat('7', 64), true, true, '{}'::jsonb, now(), now()
       )`
    );
  });

  await expectError(client, "webhook_sensitive_metadata", async () => {
    await client.query(
      `insert into communication_webhook_evidence (
         webhook_evidence_id, tenant_id, card_id, communication_id, channel,
         provider_account_reference, provider_event_id, payload_hash,
       signature_verified, durable_payload_retention_enabled, sanitized_metadata,
         received_at, recorded_at
       ) values (
         'webhook-sensitive', 'tenant-test', 'card-test', 'communication-test',
         'telephony', 'provider-account-redacted', 'provider-event-sensitive',
         repeat('8', 64), true, false, '{"rawPayload":"secret"}'::jsonb,
         now(), now()
       )`
    );
  });

  await client.query(
    `insert into communication_routing_policies (
       routing_policy_id, tenant_id, card_id, policy_version, status, channel,
       priority, condition, action, created_at, updated_at
     ) values (
       'routing-policy-test', 'tenant-test', 'card-test', 'routing-v1',
       'active', 'telephony', 10, '{"reasonCode":"AFTER_HOURS"}'::jsonb,
       '{"action":"block"}'::jsonb, now(), now()
     )`
  );
  await client.query(
    `insert into communication_receptionist_sessions (
       receptionist_session_id, tenant_id, card_id, communication_id,
       receptionist_interaction_id, language, escalation_state,
       can_dispatch_providers_directly, safe_summary_hash, created_at, updated_at
     ) values (
       'receptionist-session-test', 'tenant-test', 'card-test',
       'communication-test', null, 'en-US', 'none', false, repeat('8', 64),
       now(), now()
     )`
  );

  await expectError(client, "receptionist_null_card_bypass", async () => {
    await client.query(
      `insert into communication_receptionist_sessions (
         receptionist_session_id, tenant_id, card_id, communication_id,
         receptionist_interaction_id, language, escalation_state,
         can_dispatch_providers_directly, safe_summary_hash, created_at, updated_at
       ) values (
         'receptionist-session-null-card', 'tenant-test', null,
         'communication-test', null, 'en-US', 'none', false, repeat('8', 64),
         now(), now()
       )`
    );
  });

  await client.query(
    `insert into communication_adapter_health (
       adapter_health_id, tenant_id, adapter_id, channel, status, checked_at,
       reason_codes, sanitized_metadata
     ) values (
       'adapter-health-test', 'tenant-test', 'telephony-adapter-disabled',
       'telephony', 'healthy', now(), '[]'::jsonb, '{}'::jsonb
     )`
  );

  await client.query(
    `insert into communication_trust_evidence_references (
       trust_evidence_reference_id, tenant_id, card_id, communication_id,
       domain, artifact_schema, canonicalization_version, key_purpose,
       envelope_id, trust_event_id, evidence_fields, recorded_at
     ) values (
       'trust-ref-test', 'tenant-test', 'card-test', 'communication-test',
       'communications.webhook', 'communication-webhook-evidence-v1',
       'bidayax-c14n-1', 'verification_only', null, null,
       '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
       now()
     )`
  );

  await expectError(client, "trust_null_card_bypass", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-null-card', 'tenant-test', null, 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'verification_only', null, null,
         '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
         now()
       )`
    );
  });

  await expectError(client, "trust_sensitive_metadata", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-sensitive', 'tenant-test', 'card-test', 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'verification_only', null, null,
         '{"rawTranscript":"secret"}'::jsonb, now()
       )`
    );
  });

  await expectError(client, "trust_non_allowlisted_metadata", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-unexpected', 'tenant-test', 'card-test', 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'verification_only', null, null,
         '{"safeButUnexpected":"value"}'::jsonb, now()
       )`
    );
  });

  await expectError(client, "audit_null_card_bypass", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, authorization_decision_id, permission_version,
         policy_version, result, reason_code, occurred_at, metadata
       ) values (
         'audit-null-card', 'tenant-test', null, 'communication-test',
         'communication.denied', 'user', 'user-test', 'authz-deny',
         'communications-permissions-v1', 'communications-policy-v1',
         'denied', 'NULL_CARD_BYPASS', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "audit_sensitive_metadata", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, authorization_decision_id, permission_version,
         policy_version, result, reason_code, occurred_at, metadata
       ) values (
         'audit-sensitive', 'tenant-test', 'card-test', 'communication-test',
         'communication.denied', 'user', 'user-test', 'authz-deny',
         'communications-permissions-v1', 'communications-policy-v1',
         'denied', 'RAW_DATA_REJECTED', now(), '{"email":"caller@example.test"}'::jsonb
       )`
    );
  });

  await expectError(client, "audit_user_without_actor", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, authorization_decision_id, permission_version,
         policy_version, result, reason_code, occurred_at, metadata
       ) values (
         'audit-user-without-actor', 'tenant-test', 'card-test', 'communication-test',
         'communication.denied', 'user', null, 'authz-deny',
         'communications-permissions-v1', 'communications-policy-v1',
         'denied', 'MISSING_ACTOR', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "audit_append_only", async () => {
    await client.query(
      `update communication_audit_events
          set metadata = '{"mutated":true}'::jsonb
        where audit_event_id = 'audit-test'`
    );
  });

  await expectError(client, "lifecycle_append_only", async () => {
    await client.query(
      `delete from communication_lifecycle_transitions
        where transition_id = 'transition-test'`
    );
  });

  await expectError(client, "consent_append_only", async () => {
    await client.query(
      `update communication_consent_receipts
          set status = 'denied'
        where consent_receipt_id = 'consent-granted'`
    );
  });

  const credentialColumns = await client.query<{ column_name: string }>(
    `select column_name
       from information_schema.columns
      where table_schema = 'public'
        and table_name like 'communication_%'
        and column_name ~* '(credential|secret|token|private_key|raw_body|raw_payload|raw_transcript|audio)'`
  );
  if (credentialColumns.rowCount !== 0) {
    throw new Error(
      `Communication tables contain prohibited credential/raw payload columns: ${credentialColumns.rows
        .map((row) => row.column_name)
        .join(", ")}.`
    );
  }

  return [
    `complete migration chain applied inside a transaction (${migrationFiles.length} files)`,
    "all 15 Communications data-model tables exist",
    "tenant/card composite endpoint relationships reject cross-card and cross-tenant rows",
    "null-card bypass attempts are rejected across child and reference rows",
    "command idempotency rejects duplicate requests",
    "forged actors, revoked sessions, and revoked grants are rejected",
    "lifecycle transitions advance state with append-only optimistic sequencing",
    "invalid and terminal lifecycle transitions are rejected",
    "queued dispatch requires active cited consent",
    "consent receipts reject cross-card and channel/purpose-mismatched policies",
    "missing, expired, revoked, and ambiguous consent deny insert and update dispatch paths",
    "active suppressions deny insert and update dispatch paths",
    "provider dispatch remains disabled",
    "webhook evidence rejects raw body retention and sensitive metadata",
    "trust evidence rejects sensitive and non-allowlisted fields",
    "audit events reject sensitive metadata and user events without actors",
    "audit, lifecycle, and consent evidence are append-only",
    "communication tables contain no credential, token, raw payload, transcript, or audio columns"
  ];
}

const connectionString = await resolveConnectionString();
const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query("BEGIN");
  const migrationFiles = await applyMigrations(client);
  const details = await runVerification(client, migrationFiles);
  await client.query("ROLLBACK");
  finish("passed", details);
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Ignore rollback failures during connection or setup errors.
  }

  finish("failed", [error instanceof Error ? error.message : String(error)]);
} finally {
  await client.end().catch(() => undefined);

  if (disposableContainerStarted) {
    execFileSync(dockerExecutable, ["rm", "-f", containerName], {
      stdio: "ignore"
    });
  }
}
