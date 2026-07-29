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

class VerificationCompletion extends Error {
  readonly status: VerificationStatus;
  readonly line: string;

  constructor(status: VerificationStatus, line: string) {
    super(line);
    this.status = status;
    this.line = line;
  }
}

const cardScopedCommunicationOperations = [
  "cancel_callback",
  "schedule_communication",
  "initiate_communication",
  "accept_inbound_communication_event",
  "escalate_to_human",
  "suppress_communication",
  "release_suppression",
  "evaluate_consent",
  "evaluate_business_hours",
  "evaluate_routing",
  "query_communication_status",
  "terminate_communication"
] as const;

const consentGrantedObservedAt = "2026-07-25T10:00:00.000Z";
const consentExpiredObservedAt = "2026-07-23T10:00:00.000Z";
const consentExpiredExpiresAt = "2026-07-24T10:00:00.000Z";
const consentStalePolicyObservedAt = "2026-07-25T09:00:00.000Z";
const consentRevokedObservedAt = "2026-07-25T08:00:00.000Z";
const consentRevokedAt = "2026-07-25T08:30:00.000Z";

const expectedFailurePatterns: Record<string, RegExp> = {
  audit_append_only: /immutable|append-only/i,
  audit_null_card_bypass: /card scope|not-null|null/i,
  audit_service_disabled: /active service identity/i,
  audit_sensitive_metadata: /safe|sensitive|check constraint/i,
  audit_user_without_actor: /requires active tenant membership|not-null|check constraint/i,
  adapter_health_sensitive_reason_code: /safe|sensitive|check constraint/i,
  adapter_health_non_string_reason_code: /check constraint/i,
  adapter_health_nested_reason_code: /check constraint/i,
  adapter_health_prose_reason_code: /check constraint/i,
  adapter_health_oversized_reason_code: /check constraint/i,
  business_hours_sensitive_window: /safe|sensitive|check constraint/i,
  command_backdated_expired_grant: /grant is not active|check constraint/i,
  command_backdated_expired_session: /session is not active|check constraint/i,
  command_long_transaction_expired_grant: /grant is not active|check constraint/i,
  command_long_transaction_expired_session: /session is not active|check constraint/i,
  command_authorization_immutable: /immutable/i,
  command_auth_cross_operation_reuse: /authorization decision resource mismatch/i,
  command_direct_terminal_insert: /reserved state|terminal result/i,
  command_failed_cannot_carry_result: /failure cannot carry a result/i,
  command_forged_authorization_versions: /permission_version|policy_version|check constraint/i,
  command_missing_completion_result: /completion requires result/i,
  command_duplicate: /duplicate key|unique/i,
  command_persisted_replay: /check constraint|terminal command status/i,
  command_reserved_with_result: /reserved state|terminal result/i,
  command_user_platform_kill_switch: /check constraint|platform kill-switch|actor mismatch|user context mismatch/i,
  command_reopen_completed_result: /reserved to a terminal command status|immutable/i,
  command_service_cross_tenant: /active service identity|foreign key|tenant/i,
  command_service_disabled: /active service identity|foreign key/i,
  command_service_unprivileged: /tenant kill-switch capability/i,
  command_tenant_kill_switch_viewer: /owner or admin membership/i,
  command_platform_unprivileged: /platform kill-switch capability/i,
  command_missing_authorization_card_grant_id: /authorization decision user context mismatch/i,
  command_missing_authorization_operation: /authorization decision resource mismatch/i,
  command_missing_authorization_request_hash: /authorization decision resource mismatch/i,
  command_missing_authorization_required_permission: /authorization decision resource mismatch/i,
  command_missing_authorization_scope_id: /authorization decision resource mismatch/i,
  command_missing_authorization_scope_type: /authorization decision resource mismatch/i,
  command_missing_authorization_session_id: /authorization decision user context mismatch/i,
  consent_append_only: /immutable|append-only/i,
  communication_direct_state_update: /lifecycle transition/i,
  communication_forged_lifecycle_setting: /lifecycle transition/i,
  communication_invalid_initial_state: /initial state|requested/i,
  consent_missing_evidence: /not-null|matching durable consent evidence/i,
  consent_nonexistent_evidence: /foreign key|matching durable consent evidence/i,
  consent_null_card_bypass: /card scope|not-null|null|matching durable consent evidence/i,
  consent_null_trust_event_evidence: /trust_event_id|check constraint|trust event/i,
  consent_invalid_verification_receipt: /valid envelope verification receipt/i,
  consent_revoked_envelope_evidence: /active unexpired envelope/i,
  consent_policy_append_only: /immutable|append-only/i,
  consent_policy_cross_card: /policy.*card|foreign key|card/i,
  consent_policy_purpose_channel_mismatch: /policy.*channel|policy.*purpose|channel does not match policy|purpose does not match policy/i,
  consent_missing_policy_version_evidence: /policy version does not match cited policy|does not match receipt/i,
  consent_null_policy_version_evidence: /policy version does not match cited policy|does not match receipt/i,
  consent_wrong_policy_version_evidence: /policy version does not match cited policy/i,
  consent_wrong_receipt_evidence: /does not match receipt/i,
  consent_missing_channel_evidence: /does not match receipt/i,
  consent_missing_participant_evidence: /does not match receipt/i,
  consent_missing_policy_evidence: /does not match receipt/i,
  consent_missing_purpose_evidence: /does not match receipt/i,
  consent_missing_receipt_evidence: /does not match receipt/i,
  consent_missing_source_evidence: /does not match receipt/i,
  consent_missing_status_evidence: /does not match receipt/i,
  consent_missing_observed_time_evidence: /does not match receipt timing/i,
  consent_mismatched_observed_time_evidence: /does not match receipt timing/i,
  consent_mismatched_effective_time_evidence: /does not match receipt timing/i,
  consent_missing_expiry_evidence: /does not match receipt expiry/i,
  consent_mismatched_expiry_evidence: /does not match receipt expiry/i,
  consent_mismatched_revocation_time_evidence: /revocation chronology/i,
  consent_invalid_chronology: /chronology is invalid/i,
  direct_terminal_transition: /invalid communication lifecycle transition/i,
  dispatch_ambiguous_consent: /ambiguous|multiple active consent|exactly one active consent/i,
  dispatch_authorization_fields_immutable: /immutable/i,
  dispatch_expired_consent: /active cited consent|expired|policy/i,
  dispatch_missing_consent: /active cited consent|consent/i,
  dispatch_null_card_bypass: /card scope|not-null|null/i,
  dispatch_provider_enabled: /provider dispatch/i,
  dispatch_revoked_consent: /revoked|active cited consent/i,
  dispatch_stale_policy: /policy|expired|active cited consent/i,
  dispatch_suppressed: /suppression|active cited consent/i,
  dispatch_update_missing_consent: /active cited consent|consent/i,
  dispatch_update_suppressed: /suppression/i,
  endpoint_cross_card: /card scope|foreign key|card/i,
  endpoint_cross_tenant: /foreign key|tenant|existing participant/i,
  endpoint_null_card_bypass: /card scope|not-null|null/i,
  failover_append_only: /immutable|append-only/i,
  failover_provider_enabled: /provider dispatch|provider_dispatch_enabled/i,
  forged_actor: /active tenant membership|session|grant|foreign key/i,
  invalid_transition: /invalid communication lifecycle transition/i,
  lifecycle_append_only: /immutable|append-only/i,
  lifecycle_backdated_transition: /backdate aggregate chronology/i,
  lifecycle_missing_authz: /authorization decision/i,
  lifecycle_wrong_operation_authz: /authorization decision resource mismatch/i,
  lifecycle_cross_card: /card scope|card mismatch|foreign key/i,
  lifecycle_null_card_bypass: /card scope|not-null|null/i,
  receptionist_null_card_bypass: /card scope|not-null|null/i,
  receptionist_unowned_interaction_reference: /check constraint|receptionist_interaction_id/i,
  revoked_grant: /grant is not active/i,
  revoked_session: /session is not active/i,
  summary_append_only: /immutable|append-only/i,
  summary_forged_actor: /active service identity|active platform identity|active tenant membership/i,
  summary_missing_user_grant: /active card grant|active session/i,
  summary_null_card_bypass: /card scope|not-null|null/i,
  suppression_double_release: /update must release one active suppression|immutable|audit evidence does not match/i,
  suppression_release_audit_reuse: /duplicate key|release audit/i,
  suppression_release_wrong_reason: /audit evidence does not match suppression resource/i,
  suppression_null_card_bypass: /card scope|not-null|null/i,
  suppression_release_missing_audit: /matching release audit evidence|audit evidence|foreign key/i,
  suppression_scope_immutable: /scope and creation evidence is immutable/i,
  trust_domain_schema_mismatch: /domain and artifact schema|envelope is incompatible/i,
  trust_event_mismatch: /trust event is incompatible/i,
  trust_event_missing_envelope_link: /trust event is incompatible/i,
  trust_missing_durable_link: /cryptographic envelope|not-null/i,
  trust_non_allowlisted_metadata: /allowlisted|check constraint/i,
  trust_null_card_bypass: /card scope|envelope is incompatible|not-null/i,
  trust_payload_projection_mismatch: /projection must match signed envelope payload/i,
  trust_expired_envelope: /active unexpired envelope/i,
  trust_revoked_envelope: /active unexpired envelope/i,
  trust_superseded_envelope: /active unexpired envelope/i,
  trust_sensitive_metadata: /safe|sensitive|check constraint/i,
  trust_signed_after_recorded: /active unexpired envelope/i,
  trust_wrong_key_purpose: /key_purpose|check constraint|envelope is incompatible/i,
  webhook_null_card_bypass: /card scope|not-null|null/i,
  webhook_raw_body: /durable payload|durable_payload_retention/i,
  webhook_sensitive_metadata: /safe|sensitive|check constraint/i
};

function finish(status: VerificationStatus, details: readonly string[]): never {
  const output = {
    component: "communications-data-model-postgres-verifier",
    details,
    event: "communications_data_model_postgres_verification_completed",
    status
  };

  const line = JSON.stringify(output);

  throw new VerificationCompletion(status, line);
}

function assertDisposableDatabaseUrl(url: string) {
  const parsedUrl = new URL(url);
  const databaseName = parsedUrl.pathname.replace(/^\//, "");
  const host = parsedUrl.hostname.toLowerCase();
  const safeLocalHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

  if (
    parsedUrl.protocol !== "postgres:" &&
    parsedUrl.protocol !== "postgresql:"
  ) {
    finish("failed", [
      `Refusing to run against database URL with unsupported protocol '${parsedUrl.protocol}'. Use postgres:// or postgresql:// for the exact local disposable PostgreSQL verifier target.`
    ]);
  }

  if (parsedUrl.searchParams.size > 0) {
    finish("failed", [
      "Refusing to run against database URL with connection parameters. Use the exact local disposable PostgreSQL verifier target without query parameters."
    ]);
  }

  if (!safeLocalHosts.has(host)) {
    finish("failed", [
      `Refusing to run against non-local database host '${parsedUrl.hostname}'. Use the disposable local PostgreSQL verifier target.`
    ]);
  }

  if (databaseName !== disposableDatabaseName) {
    finish("failed", [
      `Refusing to run against database '${databaseName}'. Expected disposable database '${disposableDatabaseName}'.`
    ]);
  }

  return url;
}

function expectDisposableDatabaseUrlRejection(url: string) {
  try {
    assertDisposableDatabaseUrl(url);
  } catch (error) {
    if (error instanceof VerificationCompletion && error.status === "failed") {
      return;
    }

    throw error;
  }

  throw new Error(`Unsafe database URL was accepted: ${url}`);
}

function verifyDatabaseUrlSafety() {
  assertDisposableDatabaseUrl(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}`
  );
  assertDisposableDatabaseUrl(
    `postgres://postgres:postgres@localhost:5432/${disposableDatabaseName}`
  );
  assertDisposableDatabaseUrl(
    `postgres://postgres:postgres@[::1]:5432/${disposableDatabaseName}`
  );
  assertDisposableDatabaseUrl(
    `postgresql://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}`
  );

  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@db.example.com:5432/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `socket://localhost/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `socket://localhost/${disposableDatabaseName}?db=${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `socket://127.0.0.1/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `http://127.0.0.1:5432/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres+srv://127.0.0.1:5432/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@[2001:db8::1]:5432/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@%2Fvar%2Frun%2Fpostgresql:5432/${disposableDatabaseName}`
  );
  expectDisposableDatabaseUrlRejection(
    "postgres://postgres:postgres@127.0.0.1:5432/production_ci"
  );
  expectDisposableDatabaseUrlRejection(
    "postgres://postgres:postgres@127.0.0.1:5432/customer_local"
  );
  expectDisposableDatabaseUrlRejection(
    "postgres://postgres:postgres@127.0.0.1:5432/test"
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?host=db.example.com`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?port=5432`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?sslmode=require`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?ssl=true`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?sslcert=/tmp/client.crt`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?sslkey=/tmp/client.key`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?sslrootcert=/tmp/ca.crt`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?service=production`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?servicefile=/tmp/pg_service.conf`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?host=127.0.0.1&host=db.example.com`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?%68ost=db.example.com`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?HOST=db.example.com`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?SslMode=require`
  );
  expectDisposableDatabaseUrlRejection(
    `postgres://postgres:postgres@127.0.0.1:5432/${disposableDatabaseName}?host=%2Fvar%2Frun%2Fpostgresql`
  );
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
    return assertDisposableDatabaseUrl(databaseUrl);
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
  assertDisposableDatabaseUrl(connectionString);
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
  const expectedPattern = expectedFailurePatterns[label];
  if (!expectedPattern) {
    throw new Error(`${label} does not declare an expected failure pattern.`);
  }

  await client.query(`SAVEPOINT ${label}`);

  try {
    await action();
    throw new Error(`${label} did not fail as expected.`);
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${label}`);

    if (error instanceof Error && error.message.includes("did not fail")) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (!expectedPattern.test(message)) {
      throw new Error(
        `${label} failed for an unexpected reason. Expected ${expectedPattern}, got: ${message}`
      );
    }
  } finally {
    await client.query(`RELEASE SAVEPOINT ${label}`);
  }
}

async function expectPolicyLockContention(client: PgClient, connectionString: string) {
  const contender = new Client({ connectionString });

  await client.query(
    `select lock_communication_policy_subject_hierarchy_v1(
       'tenant-test', 'card-test', 'participant-test', 'telephony', 'callback'
     )`
  );

  await contender.connect();
  try {
    await contender.query("BEGIN");
    await contender.query("SET LOCAL statement_timeout = '250ms'");

    try {
      await contender.query(
        `select lock_communication_policy_subject_hierarchy_v1(
           'tenant-test', 'card-test', 'participant-test', null, 'callback'
         )`
      );
      throw new Error("policy_lock_contention did not fail as expected.");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("did not fail as expected")
      ) {
        throw error;
      }
      if ((error as { code?: string }).code !== "57014") {
        throw new Error(
          `policy_lock_contention failed with unexpected SQLSTATE ${
            (error as { code?: string }).code ?? "unknown"
          }.`
        );
      }
    } finally {
      await contender.query("ROLLBACK").catch(() => undefined);
    }
  } finally {
    await contender.end().catch(() => undefined);
  }
}

async function insertConsentEvidence(
  client: PgClient,
  evidenceReferenceId: string,
  consentReceiptId: string,
  policyVersion: string,
  options: {
    readonly envelopeStatus?: "active" | "superseded" | "revoked";
    readonly consentPolicyId?: string;
    readonly effectiveAt?: string;
    readonly evidenceOverrides?: Record<string, unknown>;
    readonly expiresAt?: string | null;
    readonly expiresAtSql?: string;
    readonly omitEvidenceFields?: readonly string[];
    readonly observedAt?: string;
    readonly participantId?: string;
    readonly purpose?: string;
    readonly revokedAt?: string | null;
    readonly source?: string;
    readonly signedAtSql?: string;
    readonly status?: string;
    readonly trustEventDetailsOverrides?: Record<string, unknown>;
    readonly trustEventType?: string;
    readonly omitTrustEventDetailsFields?: readonly string[];
    readonly verificationValid?: boolean;
  } = {}
) {
  const envelopeId = `envelope-${evidenceReferenceId}`;
  const trustEventId = `trust-event-${evidenceReferenceId}`;
  const evidenceFields: Record<string, unknown> = {
    channel: "telephony",
    consentPolicyId: options.consentPolicyId ?? "consent-policy-test",
    consentReceiptId,
    effectiveAt: options.effectiveAt ?? consentGrantedObservedAt,
    envelopeId,
    expiresAt: options.expiresAt ?? null,
    observedAt: options.observedAt ?? consentGrantedObservedAt,
    participantId: options.participantId ?? "participant-test",
    policyVersion,
    purpose: options.purpose ?? "callback",
    revokedAt: options.revokedAt ?? (options.status === "revoked" ? consentRevokedAt : null),
    source: options.source ?? "visitor",
    status: options.status ?? "granted",
    ...options.evidenceOverrides
  };

  for (const field of options.omitEvidenceFields ?? []) {
    delete evidenceFields[field];
  }

  const trustEventDetails = {
    ...evidenceFields,
    ...options.trustEventDetailsOverrides
  };

  for (const field of options.omitTrustEventDetailsFields ?? []) {
    delete trustEventDetails[field];
  }

  await client.query(
    `insert into cryptographic_envelopes (
       envelope_id, tenant_id, structure_version, envelope_version, card_id,
       artifact_type, artifact_id, artifact_version, domain, schema_version,
       canonicalization_version, algorithm_policy_version, digest_algorithm,
       digest_operation, digest, signature_algorithm, signature_operation,
       key_id, key_version, key_purpose, signer_type, signer_id, signed_at,
       expires_at, previous_envelope_id, previous_digest, provenance_manifest_id,
       metadata, status, payload, signature, immutable, created_at
     ) values (
       $1, 'tenant-test', '1', '1', 'card-test',
       'communication-consent-v1', 'communication-test', '1',
       'communications.consent', 'communication-consent-v1',
       'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
       'digest', repeat('e', 64), 'Ed25519', 'signature',
       'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
       'communications-service', ${options.signedAtSql ?? "now()"}, ${
         options.expiresAtSql ?? "null"
       }, null, null, null,
       '{}'::jsonb, $3, $2::jsonb,
       'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
     )`,
    [
      envelopeId,
      JSON.stringify(evidenceFields),
      options.envelopeStatus ?? "active"
    ]
  );
  await client.query(
    `insert into trust_events (
       event_id, tenant_id, structure_version, stream_id, event_type,
       provenance_lifecycle, subject_type, subject_id, actor_identity_id,
       occurred_at, idempotency_key, details
     ) values (
       $1, 'tenant-test', '1', 'communications-trust',
       $3, 'created', 'communications.consent',
       'communication-test', 'communications-service', now(),
       $2, $4::jsonb
     )`,
    [
      trustEventId,
      `${trustEventId}-idempotency`,
      options.trustEventType ?? "communications.consent",
      JSON.stringify(trustEventDetails)
    ]
  );
  await client.query(
    `insert into trust_verification_receipts (
       receipt_id, tenant_id, structure_version, envelope_id, verifier_identity_id,
       verified_at, valid, components, reason_codes, warnings, idempotency_key
     ) values (
       $1, 'tenant-test', '1', $2, 'communications-service', now(), $4,
       '{"signature":"valid","domain":"communications.consent"}'::jsonb,
       '["VALID"]'::jsonb, '[]'::jsonb, $3
     )`,
    [
      `verification-${evidenceReferenceId}`,
      envelopeId,
      `verification-${evidenceReferenceId}-idempotency`,
      options.verificationValid ?? true
    ]
  );
  await client.query(
    `insert into communication_trust_evidence_references (
       trust_evidence_reference_id, tenant_id, card_id, communication_id,
       domain, artifact_schema, canonicalization_version, key_purpose,
       envelope_id, trust_event_id, evidence_fields, recorded_at
     ) values (
       $1, 'tenant-test', 'card-test', 'communication-test',
       'communications.consent', 'communication-consent-v1',
       'bidayax-c14n-1', 'tenant_artifact_signing', $2, $3, $4::jsonb, now()
     )`,
    [evidenceReferenceId, envelopeId, trustEventId, JSON.stringify(evidenceFields)]
  );
}

async function insertAuthorizationDecision(
  client: PgClient,
  options: {
    readonly auditEventId: string;
    readonly cardId: string | null;
    readonly communicationId: string | null;
    readonly actorType: "user" | "service" | "platform";
    readonly actorUserId?: string | null;
    readonly actorServiceId?: string | null;
    readonly actorPlatformId?: string | null;
    readonly reasonCode: string;
    readonly metadata: Record<string, string>;
  }
) {
  await client.query(
    `insert into communication_audit_events (
       audit_event_id, tenant_id, card_id, communication_id, event_type,
       actor_type, actor_user_id, actor_service_id, actor_platform_id,
       authorization_decision_id, permission_version, policy_version, result,
       reason_code, occurred_at, metadata
     ) values (
       $1, 'tenant-test', $2, $3, 'communication.authorization_decision',
       $4, $5, $6, $7, $1, 'communications-permissions-v1',
       'communications-policy-v1', 'succeeded', $8, now(), $9::jsonb
     )`,
    [
      options.auditEventId,
      options.cardId,
      options.communicationId,
      options.actorType,
      options.actorUserId ?? null,
      options.actorServiceId ?? null,
      options.actorPlatformId ?? null,
      options.reasonCode,
      JSON.stringify(options.metadata)
    ]
  );
}

function commandAuthorizationMetadata(options: {
  readonly operation: string;
  readonly scopeType: "card" | "tenant" | "platform";
  readonly scopeId: string;
  readonly requiredPermission: string;
  readonly requestHash: string;
  readonly sessionId?: string;
  readonly cardGrantId?: string;
}) {
  return {
    operation: options.operation,
    scopeType: options.scopeType,
    scopeId: options.scopeId,
    requiredPermission: options.requiredPermission,
    requestHash: options.requestHash,
    ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    ...(options.cardGrantId ? { cardGrantId: options.cardGrantId } : {})
  };
}

function omitMetadataFields(
  metadata: Record<string, string>,
  fields: readonly string[]
) {
  const result = { ...metadata };
  for (const field of fields) {
    delete result[field];
  }
  return result;
}

function lifecycleAuthorizationMetadata(options: {
  readonly communicationId: string;
  readonly fromState: string;
  readonly toState: string;
}) {
  return {
    operation: "advance_lifecycle",
    resourceType: "communication_lifecycle_transition",
    communicationId: options.communicationId,
    fromState: options.fromState,
    toState: options.toState,
    requiredPermission: "communications:advance_lifecycle",
    sessionId: "session-test",
    cardGrantId: "grant-test"
  };
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
       ('user-viewer', 'workos', 'provider-user-viewer', 'viewer@example.test',
        'viewer@example.test', true, 'Viewer Tester', 'active', now(), now(), now()),
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
       ('membership-viewer', 'tenant-test', 'user-viewer', 'viewer', 'active', now(), now(), null),
       ('membership-other', 'tenant-other', 'user-other', 'tenant_admin', 'active', now(), now(), null),
       ('membership-revoked', 'tenant-test', 'user-revoked', 'tenant_admin', 'revoked', now(), now(), now())`
  );
  await client.query(
    `insert into card_access_grants (
       grant_id, tenant_id, card_id, user_id, permission_set, created_at, expires_at, revoked_at
     ) values
       ('grant-test', 'tenant-test', 'card-test', 'user-test',
        '[
          "communications:request_callback",
          "communications:cancel_callback",
          "communications:schedule_communication",
          "communications:initiate_communication",
          "communications:accept_inbound_communication_event",
          "communications:escalate_to_human",
          "communications:suppress_communication",
          "communications:release_suppression",
          "communications:evaluate_consent",
          "communications:evaluate_business_hours",
          "communications:evaluate_routing",
          "communications:query_communication_status",
          "communications:terminate_communication",
          "communications:advance_lifecycle"
        ]'::jsonb,
        now(), now() + interval '1 day', null)`
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
       ('session-viewer', repeat('a', 64), repeat('b', 64), 'user-viewer', 'tenant-test',
        'workos', 'provider-session-viewer', 'Passkey', now(), now(),
        now() + interval '30 minutes', now() + interval '8 hours', null),
       ('session-revoked', repeat('e', 64), repeat('f', 64), 'user-test', 'tenant-test',
        'workos', 'provider-session-revoked', 'Passkey', now(), now(),
        now() + interval '30 minutes', now() + interval '8 hours', now()),
       ('session-expired', repeat('8', 64), repeat('9', 64), 'user-test', 'tenant-test',
        'workos', 'provider-session-expired', 'Passkey', now() - interval '2 days',
        now() - interval '2 days', now() - interval '1 day', now() - interval '1 day', null),
       ('session-other', repeat('1', 64), repeat('2', 64), 'user-other', 'tenant-other',
        'workos', 'provider-session-other', 'Passkey', now(), now(),
        now() + interval '30 minutes', now() + interval '8 hours', null)`
  );
  await client.query(
    `insert into trust_crypto_identities (
       identity_id, tenant_id, structure_version, identity_type, display_name,
       status, metadata, created_at, updated_at
     ) values
       ('communications-service', 'tenant-test', '1', 'service',
        'Communications Service', 'active', '{"communicationsCapabilities":["tenant_kill_switch","audit_writer","summary_writer"]}'::jsonb, now(), now()),
       ('communications-platform', 'tenant-test', '1', 'system',
        'Communications Platform Operator', 'active', '{"communicationsCapabilities":["platform_kill_switch","audit_writer","summary_writer"]}'::jsonb, now(), now()),
       ('communications-service-unprivileged', 'tenant-test', '1', 'service',
        'Unprivileged Communications Service', 'active', '{}'::jsonb, now(), now()),
       ('communications-service-disabled', 'tenant-test', '1', 'service',
        'Disabled Communications Service', 'disabled', '{"communicationsCapabilities":["tenant_kill_switch","audit_writer","summary_writer"]}'::jsonb, now(), now()),
       ('communications-platform-unprivileged', 'tenant-test', '1', 'system',
        'Unprivileged Communications Platform Operator', 'active', '{}'::jsonb, now(), now()),
       ('communications-service-other', 'tenant-other', '1', 'service',
        'Other Communications Service', 'active', '{"communicationsCapabilities":["tenant_kill_switch"]}'::jsonb, now(), now())`
  );
  await client.query(
    `insert into trust_keys (
       key_id, key_version, tenant_id, structure_version, identity_id,
       algorithm, operation, public_key, public_key_encoding, purpose,
       scope_id, provider_type, provider_key_reference, status, valid_from,
       valid_until, status_changed_at, replaces_key_id, replaces_key_version,
       revoked_at, compromised_at, metadata, created_at
     ) values (
       'communications-trust-key', 1, 'tenant-test', '1',
       'communications-service', 'Ed25519', 'signature',
       'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
       'spki-der-base64url', 'tenant_artifact_signing', 'tenant-test',
       'kms', 'communications-test-key-reference', 'active',
       now() - interval '1 day', null, now() - interval '1 day',
       null, null, null, null, '{}'::jsonb, now()
     )`
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
         '2026-07-20T00:00:00.000Z'::timestamptz, null),
        ('consent-policy-expired-at-evaluation', 'tenant-test', 'card-test', 'communications-consent-v2',
         'US', 'telephony', 'callback', true, false, false, 'consent',
          '2026-07-20T00:00:00.000Z'::timestamptz, '2026-07-25T09:30:00.000Z'::timestamptz),
        ('consent-policy-other-card', 'tenant-test', 'card-other', 'communications-consent-v1',
         'US', 'telephony', 'callback', true, false, false, 'consent',
          '2026-07-20T00:00:00.000Z'::timestamptz, null),
       ('consent-policy-scheduling', 'tenant-test', 'card-test', 'communications-consent-v3',
         'US', 'scheduling', 'scheduling', true, false, false, 'consent',
          '2026-07-20T00:00:00.000Z'::timestamptz, null)`
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
         'outbound', 'requested', 0, 'callback_completed',
         'internal_operational_metadata', 'operational', null, '{}'::jsonb,
         now(), now())`
  );
  await client.query(
    `insert into cryptographic_envelopes (
       envelope_id, tenant_id, structure_version, envelope_version, card_id,
       artifact_type, artifact_id, artifact_version, domain, schema_version,
       canonicalization_version, algorithm_policy_version, digest_algorithm,
       digest_operation, digest, signature_algorithm, signature_operation,
       key_id, key_version, key_purpose, signer_type, signer_id, signed_at,
       expires_at, previous_envelope_id, previous_digest, provenance_manifest_id,
       metadata, status, payload, signature, immutable, created_at
     ) values
       (
        'envelope-consent-granted', 'tenant-test', '1', '1', 'card-test',
        'communication-consent-v1', 'communication-test', '1',
        'communications.consent', 'communication-consent-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('b', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'active',
        '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-granted","observedAt":"2026-07-25T10:00:00.000Z","effectiveAt":"2026-07-25T10:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-granted","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"granted"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       ),
       (
        'envelope-consent-expired', 'tenant-test', '1', '1', 'card-test',
        'communication-consent-v1', 'communication-test', '1',
        'communications.consent', 'communication-consent-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('c', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'active',
        '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-expired","observedAt":"2026-07-23T10:00:00.000Z","effectiveAt":"2026-07-23T10:00:00.000Z","expiresAt":"2026-07-24T10:00:00.000Z","revokedAt":null,"envelopeId":"envelope-consent-expired","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"expired"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       ),
       (
        'envelope-consent-stale-policy', 'tenant-test', '1', '1', 'card-test',
        'communication-consent-v1', 'communication-test', '1',
        'communications.consent', 'communication-consent-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('d', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'active',
        '{"channel":"telephony","consentPolicyId":"consent-policy-expired-at-evaluation","consentReceiptId":"consent-stale-policy","observedAt":"2026-07-25T09:00:00.000Z","effectiveAt":"2026-07-25T09:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-stale-policy","participantId":"participant-test","policyVersion":"communications-consent-v2","purpose":"callback","source":"visitor","status":"granted"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       )`
  );
  await client.query(
    `insert into trust_events (
       event_id, tenant_id, structure_version, stream_id, event_type,
       provenance_lifecycle, subject_type, subject_id, actor_identity_id,
       occurred_at, idempotency_key, details
     ) values
       ('trust-event-consent-granted', 'tenant-test', '1', 'communications-trust',
       'communications.consent', 'created', 'communications.consent',
       'communication-test', 'communications-service', now(),
        'trust-event-consent-granted-idempotency',
        '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-granted","observedAt":"2026-07-25T10:00:00.000Z","effectiveAt":"2026-07-25T10:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-granted","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"granted"}'::jsonb),
       ('trust-event-consent-expired', 'tenant-test', '1', 'communications-trust',
        'communications.consent', 'created', 'communications.consent',
        'communication-test', 'communications-service', now(),
        'trust-event-consent-expired-idempotency',
        '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-expired","observedAt":"2026-07-23T10:00:00.000Z","effectiveAt":"2026-07-23T10:00:00.000Z","expiresAt":"2026-07-24T10:00:00.000Z","revokedAt":null,"envelopeId":"envelope-consent-expired","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"expired"}'::jsonb),
       ('trust-event-consent-stale-policy', 'tenant-test', '1', 'communications-trust',
        'communications.consent', 'created', 'communications.consent',
        'communication-test', 'communications-service', now(),
        'trust-event-consent-stale-policy-idempotency',
        '{"channel":"telephony","consentPolicyId":"consent-policy-expired-at-evaluation","consentReceiptId":"consent-stale-policy","observedAt":"2026-07-25T09:00:00.000Z","effectiveAt":"2026-07-25T09:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-stale-policy","participantId":"participant-test","policyVersion":"communications-consent-v2","purpose":"callback","source":"visitor","status":"granted"}'::jsonb)`
  );
  await client.query(
    `insert into trust_verification_receipts (
       receipt_id, tenant_id, structure_version, envelope_id, verifier_identity_id,
       verified_at, valid, components, reason_codes, warnings, idempotency_key
     ) values
       ('verification-consent-granted', 'tenant-test', '1', 'envelope-consent-granted',
        'communications-service', now(), true, '{"signature":"valid"}'::jsonb,
        '["VALID"]'::jsonb, '[]'::jsonb, 'verification-consent-granted-idempotency'),
       ('verification-consent-expired', 'tenant-test', '1', 'envelope-consent-expired',
        'communications-service', now(), true, '{"signature":"valid"}'::jsonb,
        '["VALID"]'::jsonb, '[]'::jsonb, 'verification-consent-expired-idempotency'),
       ('verification-consent-stale-policy', 'tenant-test', '1', 'envelope-consent-stale-policy',
        'communications-service', now(), true, '{"signature":"valid"}'::jsonb,
        '["VALID"]'::jsonb, '[]'::jsonb, 'verification-consent-stale-policy-idempotency')`
  );
  await client.query(
    `insert into communication_trust_evidence_references (
       trust_evidence_reference_id, tenant_id, card_id, communication_id,
       domain, artifact_schema, canonicalization_version, key_purpose,
       envelope_id, trust_event_id, evidence_fields, recorded_at
     ) values
       ('evidence-consent-granted', 'tenant-test', 'card-test', 'communication-test',
        'communications.consent', 'communication-consent-v1',
        'bidayax-c14n-1', 'tenant_artifact_signing', 'envelope-consent-granted',
        'trust-event-consent-granted',
        '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-granted","observedAt":"2026-07-25T10:00:00.000Z","effectiveAt":"2026-07-25T10:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-granted","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"granted"}'::jsonb,
        now()),
       ('evidence-consent-expired', 'tenant-test', 'card-test', 'communication-test',
        'communications.consent', 'communication-consent-v1',
        'bidayax-c14n-1', 'tenant_artifact_signing', 'envelope-consent-expired',
        'trust-event-consent-expired',
        '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-expired","observedAt":"2026-07-23T10:00:00.000Z","effectiveAt":"2026-07-23T10:00:00.000Z","expiresAt":"2026-07-24T10:00:00.000Z","revokedAt":null,"envelopeId":"envelope-consent-expired","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"expired"}'::jsonb,
        now()),
       ('evidence-consent-stale-policy', 'tenant-test', 'card-test', 'communication-test',
        'communications.consent', 'communication-consent-v1',
        'bidayax-c14n-1', 'tenant_artifact_signing', 'envelope-consent-stale-policy',
        'trust-event-consent-stale-policy',
        '{"channel":"telephony","consentPolicyId":"consent-policy-expired-at-evaluation","consentReceiptId":"consent-stale-policy","observedAt":"2026-07-25T09:00:00.000Z","effectiveAt":"2026-07-25T09:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-stale-policy","participantId":"participant-test","policyVersion":"communications-consent-v2","purpose":"callback","source":"visitor","status":"granted"}'::jsonb,
        now())`
  );
  await client.query(
    `insert into communication_consent_receipts (
       consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
       channel, purpose, status, source, evidence_reference_id, observed_at,
       effective_at, expires_at, revoked_at, metadata
     ) values
       ('consent-granted', 'tenant-test', 'card-test', 'participant-test',
        'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
        'evidence-consent-granted', '2026-07-25T10:00:00.000Z'::timestamptz,
        '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{"reasonCode":"CONSENT_GRANTED"}'::jsonb),
        ('consent-expired', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'expired', 'visitor',
         'evidence-consent-expired', '2026-07-23T10:00:00.000Z'::timestamptz,
         '2026-07-23T10:00:00.000Z'::timestamptz, '2026-07-24T10:00:00.000Z'::timestamptz, null, '{"reasonCode":"CONSENT_EXPIRED"}'::jsonb),
        ('consent-stale-policy', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-expired-at-evaluation', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-stale-policy', '2026-07-25T09:00:00.000Z'::timestamptz,
         '2026-07-25T09:00:00.000Z'::timestamptz, null, null, '{"reasonCode":"CONSENT_POLICY_STALE"}'::jsonb)`
  );
  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-allow",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: commandAuthorizationMetadata({
      operation: "request_callback",
      requiredPermission: "communications:request_callback",
      requestHash: "e".repeat(64),
      scopeId: "card-test",
      scopeType: "card",
      sessionId: "session-test",
      cardGrantId: "grant-test"
    }),
    reasonCode: "COMMAND_ALLOWED"
  });
  await insertAuthorizationDecision(client, {
    actorType: "service",
    actorServiceId: "communications-service",
    auditEventId: "authz-service",
    cardId: null,
    communicationId: null,
    metadata: commandAuthorizationMetadata({
      operation: "apply_tenant_kill_switch",
      requiredPermission: "communications:tenant:kill_switch",
      requestHash: "4".repeat(64),
      scopeId: "tenant-test",
      scopeType: "tenant"
    }),
    reasonCode: "TENANT_KILL_SWITCH_ALLOWED"
  });
  await insertAuthorizationDecision(client, {
    actorType: "platform",
    actorPlatformId: "communications-platform",
    auditEventId: "authz-platform",
    cardId: null,
    communicationId: null,
    metadata: commandAuthorizationMetadata({
      operation: "apply_platform_kill_switch",
      requiredPermission: "communications:platform:kill_switch",
      requestHash: "5".repeat(64),
      scopeId: "platform",
      scopeType: "platform"
    }),
    reasonCode: "PLATFORM_KILL_SWITCH_ALLOWED"
  });
  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-lifecycle-policy-checking",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: lifecycleAuthorizationMetadata({
      communicationId: "communication-test",
      fromState: "requested",
      toState: "policy_checking"
    }),
    reasonCode: "LIFECYCLE_ALLOWED"
  });
  for (const operation of cardScopedCommunicationOperations) {
    await insertAuthorizationDecision(client, {
      actorType: "user",
      actorUserId: "user-test",
      auditEventId: `authz-${operation}`,
      cardId: "card-test",
      communicationId: "communication-test",
      metadata: commandAuthorizationMetadata({
        operation,
        requiredPermission: `communications:${operation}`,
        requestHash: "7".repeat(64),
        scopeId: "card-test",
        scopeType: "card",
        sessionId: "session-test",
        cardGrantId: "grant-test"
      }),
      reasonCode: "COMMAND_ALLOWED"
    });
  }
  await client.query(
    `insert into communication_command_idempotency_keys (
       tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
       request_hash, result_communication_id, actor_type, actor_user_id,
       actor_service_id, actor_platform_id, session_id, card_grant_id,
      authorization_decision_id, required_permission, permission_version,
      policy_version, status, created_at, completed_at, expires_at
      ) values (
        'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
        'command-test', repeat('e', 64), null, 'user',
        'user-test', null, null, 'session-test', 'grant-test', 'authz-allow',
        'communications:request_callback', 'communications-permissions-v1',
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
       'authz-lifecycle-policy-checking', now(), '{}'::jsonb
     )`
  );
  await client.query(
    `insert into communication_audit_events (
       audit_event_id, tenant_id, card_id, communication_id, event_type,
       actor_type, actor_user_id, actor_service_id, actor_platform_id,
       authorization_decision_id, permission_version, policy_version, result,
       reason_code, occurred_at, metadata
      ) values (
        'audit-test', 'tenant-test', 'card-test', 'communication-test',
        'communication.policy_checking', 'user', 'user-test', null, null,
        'authz-allow', 'communications-permissions-v1', 'communications-policy-v1',
        'succeeded', 'CONSENT_CHECK_STARTED', now(),
        '{"safe":true,"sessionId":"session-test","cardGrantId":"grant-test","requiredPermission":"communications:advance_lifecycle"}'::jsonb
      )`
  );
}

async function runVerification(
  client: PgClient,
  migrationFiles: readonly string[],
  connectionString: string
) {
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
          'communication_business_hours_policies',
          'communication_receptionist_sessions',
          'communication_adapter_health',
          'communication_summaries',
          'communication_failover_events',
          'communication_trust_evidence_references',
          'communication_audit_events'
        )
      order by table_name`
  );

  if (tableCheck.rowCount !== 18) {
    throw new Error(
      `Expected 18 Communications data-model tables, found ${tableCheck.rowCount ?? 0}.`
    );
  }

  await seedFoundation(client);
  await seedCommunications(client);
  await expectPolicyLockContention(client, connectionString);

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
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
          'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
          'command-test', repeat('e', 64), null, 'user',
          'user-test', null, null, 'session-test', 'grant-test', 'authz-allow',
          'communications:request_callback', 'communications-permissions-v1',
          'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
        )`
    );
  });

  await expectError(client, "command_reserved_with_result", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
        ) values (
          'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
          'command-reserved-with-result', repeat('e', 64), 'communication-test', 'user',
          'user-test', null, null, 'session-test', 'grant-test', 'authz-allow',
          'communications:request_callback', 'communications-permissions-v1',
          'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
        )`
    );
  });

  await expectError(client, "command_direct_terminal_insert", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
        ) values (
          'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
          'command-terminal-insert', repeat('0', 64), 'communication-test', 'user',
          'user-test', null, null, 'session-test', 'grant-test', 'authz-allow',
          'communications:request_callback', 'communications-permissions-v1',
          'communications-policy-v1', 'completed', now(), now(), now() + interval '1 day'
        )`
    );
  });

  await expectError(client, "forged_actor", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
        ) values (
          'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
          'command-forged', repeat('1', 64), null, 'user',
          'user-other', null, null, 'session-test', 'grant-test', 'authz-deny',
          'communications:request_callback', 'communications-permissions-v1',
          'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
        )`
    );
  });

  await expectError(client, "command_tenant_kill_switch_viewer", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'tenant', 'tenant-test', 'apply_tenant_kill_switch',
         'command-viewer-tenant-kill-switch', repeat('8', 64), null, 'user',
         'user-viewer', null, null, 'session-viewer', null, 'authz-deny',
         'communications:tenant:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_user_platform_kill_switch", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'platform', 'platform', 'apply_platform_kill_switch',
         'command-user-platform-kill-switch', repeat('5', 64), null, 'user',
         'user-test', null, null, 'session-test', null, 'authz-platform',
         'communications:platform:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_forged_authorization_versions", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, actor_service_id, actor_platform_id,
         authorization_decision_id, permission_version, policy_version, result,
         reason_code, occurred_at, metadata
       ) values (
         'authz-forged-versions', 'tenant-test', 'card-test', 'communication-test',
         'communication.authorization_decision', 'user', 'user-test', null, null,
         'authz-forged-versions', 'forged-v999', 'communications-policy-v1',
         'succeeded', 'COMMAND_ALLOWED', now(),
         '{"operation":"request_callback","scopeType":"card","scopeId":"card-test","requiredPermission":"communications:request_callback","requestHash":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","sessionId":"session-test","cardGrantId":"grant-test"}'::jsonb
       )`
    );
  });

  await expectError(client, "revoked_session", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
        ) values (
          'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
          'command-revoked-session', repeat('2', 64), null, 'user',
          'user-test', null, null, 'session-revoked', 'grant-test', 'authz-deny',
          'communications:request_callback', 'communications-permissions-v1',
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
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
        ) values (
          'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
          'command-revoked-grant', repeat('3', 64), null, 'user',
          'user-test', null, null, 'session-test', 'grant-test', 'authz-deny',
          'communications:request_callback', 'communications-permissions-v1',
          'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
        )`
    );
  });

  await client.query(
    `insert into communication_command_idempotency_keys (
       tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
       request_hash, result_communication_id, actor_type, actor_user_id,
       actor_service_id, actor_platform_id, session_id, card_grant_id,
       authorization_decision_id, required_permission, permission_version,
       policy_version, status, created_at, completed_at, expires_at
     ) values
       ('tenant-test', null, 'tenant', 'tenant-test', 'apply_tenant_kill_switch',
        'command-tenant-kill-switch', repeat('4', 64), null, 'service', null,
        'communications-service', null, null, null, 'authz-service',
        'communications:tenant:kill_switch', 'communications-permissions-v1',
        'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'),
       ('tenant-test', null, 'platform', 'platform', 'apply_platform_kill_switch',
        'command-platform-kill-switch', repeat('5', 64), null, 'platform', null,
        null, 'communications-platform', null, null, 'authz-platform',
       'communications:platform:kill_switch', 'communications-permissions-v1',
       'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day')`
  );

  for (const operation of cardScopedCommunicationOperations) {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', $1,
         $2, repeat('7', 64), null, 'user',
         'user-test', null, null, 'session-test', 'grant-test', $3,
         $4, 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`,
      [
        operation,
        `command-${operation}`,
        `authz-${operation}`,
        `communications:${operation}`
      ]
    );
  }

  await client.query(
    `update communication_command_idempotency_keys
        set status = 'completed',
            result_communication_id = 'communication-test',
            completed_at = now()
      where tenant_id = 'tenant-test'
        and scope_type = 'card'
        and scope_id = 'card-test'
        and operation = 'request_callback'
        and idempotency_key = 'command-test'`
  );

  await expectError(client, "command_missing_completion_result", async () => {
    await client.query(
      `update communication_command_idempotency_keys
          set status = 'completed',
              completed_at = now()
        where idempotency_key = 'command-cancel_callback'`
    );
  });

  await expectError(client, "command_failed_cannot_carry_result", async () => {
    await client.query(
      `update communication_command_idempotency_keys
          set status = 'failed',
              result_communication_id = 'communication-test',
              completed_at = now()
        where idempotency_key = 'command-schedule_communication'`
    );
  });

  await expectError(client, "command_persisted_replay", async () => {
    await client.query(
      `update communication_command_idempotency_keys
          set status = 'replayed',
              result_communication_id = 'communication-test',
              completed_at = now()
        where idempotency_key = 'command-initiate_communication'`
    );
  });

  await expectError(client, "command_auth_cross_operation_reuse", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', 'cancel_callback',
         'command-cross-operation-authz', repeat('7', 64), null, 'user',
         'user-test', null, null, 'session-test', 'grant-test', 'authz-allow',
         'communications:cancel_callback', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  const serviceCommandMetadataBase = commandAuthorizationMetadata({
    operation: "apply_tenant_kill_switch",
    requiredPermission: "communications:tenant:kill_switch",
    requestHash: "d".repeat(64),
    scopeId: "tenant-test",
    scopeType: "tenant"
  });

  for (const [field, label] of [
    ["operation", "command_missing_authorization_operation"],
    ["scopeType", "command_missing_authorization_scope_type"],
    ["scopeId", "command_missing_authorization_scope_id"],
    ["requiredPermission", "command_missing_authorization_required_permission"],
    ["requestHash", "command_missing_authorization_request_hash"]
  ] as const) {
    const auditEventId = `authz-missing-${field}`;
    await insertAuthorizationDecision(client, {
      actorType: "service",
      actorServiceId: "communications-service",
      auditEventId,
      cardId: null,
      communicationId: null,
      metadata: omitMetadataFields(serviceCommandMetadataBase, [field]),
      reasonCode: "COMMAND_ALLOWED"
    });
    await expectError(client, label, async () => {
      await client.query(
        `insert into communication_command_idempotency_keys (
           tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
           request_hash, result_communication_id, actor_type, actor_user_id,
           actor_service_id, actor_platform_id, session_id, card_grant_id,
           authorization_decision_id, required_permission, permission_version,
           policy_version, status, created_at, completed_at, expires_at
         ) values (
           'tenant-test', null, 'tenant', 'tenant-test',
           'apply_tenant_kill_switch', $1, $2, null, 'service', null,
           'communications-service', null, null, null, $3,
           'communications:tenant:kill_switch',
           'communications-permissions-v1', 'communications-policy-v1',
           'reserved', now(), null, now() + interval '1 day'
         )`,
        [`command-${label}`, serviceCommandMetadataBase.requestHash, auditEventId]
      );
    });
  }

  const userTenantCommandMetadataBase = commandAuthorizationMetadata({
    operation: "apply_tenant_kill_switch",
    requiredPermission: "communications:tenant:kill_switch",
    requestHash: "c".repeat(64),
    scopeId: "tenant-test",
    scopeType: "tenant",
    sessionId: "session-test"
  });
  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-missing-sessionId",
    cardId: null,
    communicationId: null,
    metadata: omitMetadataFields(userTenantCommandMetadataBase, ["sessionId"]),
    reasonCode: "COMMAND_ALLOWED"
  });
  await expectError(client, "command_missing_authorization_session_id", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'tenant', 'tenant-test',
         'apply_tenant_kill_switch', 'command-missing-session-id',
         repeat('c', 64), null, 'user', 'user-test', null, null,
         'session-test', null, 'authz-missing-sessionId',
         'communications:tenant:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null,
         now() + interval '1 day'
       )`
    );
  });

  const userCardCommandMetadataBase = commandAuthorizationMetadata({
    operation: "request_callback",
    requiredPermission: "communications:request_callback",
    requestHash: "d".repeat(64),
    scopeId: "card-test",
    scopeType: "card",
    sessionId: "session-test",
    cardGrantId: "grant-test"
  });
  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-missing-cardGrantId",
    cardId: null,
    communicationId: null,
    metadata: omitMetadataFields(userCardCommandMetadataBase, ["cardGrantId"]),
    reasonCode: "COMMAND_ALLOWED"
  });
  await expectError(client, "command_missing_authorization_card_grant_id", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
         'command-missing-card-grant-id', repeat('d', 64), null, 'user',
         'user-test', null, null, 'session-test', 'grant-test',
         'authz-missing-cardGrantId', 'communications:request_callback',
         'communications-permissions-v1', 'communications-policy-v1',
         'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-expired-session",
    cardId: null,
    communicationId: null,
    metadata: commandAuthorizationMetadata({
      operation: "request_callback",
      requiredPermission: "communications:request_callback",
      requestHash: "a".repeat(64),
      scopeId: "card-test",
      scopeType: "card",
      sessionId: "session-expired",
      cardGrantId: "grant-test"
    }),
    reasonCode: "COMMAND_ALLOWED"
  });
  await expectError(client, "command_backdated_expired_session", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
         'command-backdated-expired-session', repeat('a', 64), null, 'user',
         'user-test', null, null, 'session-expired', 'grant-test',
         'authz-expired-session', 'communications:request_callback',
         'communications-permissions-v1', 'communications-policy-v1',
         'reserved', now() - interval '2 days', null, now() + interval '1 day'
      )`
    );
  });

  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-long-transaction-session-expiry",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: commandAuthorizationMetadata({
      operation: "request_callback",
      requiredPermission: "communications:request_callback",
      requestHash: "8".repeat(64),
      scopeId: "card-test",
      scopeType: "card",
      sessionId: "session-test",
      cardGrantId: "grant-test"
    }),
    reasonCode: "COMMAND_ALLOWED"
  });
  await expectError(client, "command_long_transaction_expired_session", async () => {
    await client.query(
      `update application_sessions
          set idle_expires_at = clock_timestamp() + interval '300 milliseconds',
              absolute_expires_at = clock_timestamp() + interval '300 milliseconds'
        where session_id = 'session-test'`
    );
    await delay(700);
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
         'command-long-transaction-expired-session', repeat('8', 64), null,
         'user', 'user-test', null, null, 'session-test', 'grant-test',
         'authz-long-transaction-session-expiry',
         'communications:request_callback', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now() - interval '2 days',
         null, clock_timestamp() + interval '1 day'
       )`
    );
  });

  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-expired-grant",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: commandAuthorizationMetadata({
      operation: "request_callback",
      requiredPermission: "communications:request_callback",
      requestHash: "b".repeat(64),
      scopeId: "card-test",
      scopeType: "card",
      sessionId: "session-test",
      cardGrantId: "grant-test"
    }),
    reasonCode: "COMMAND_ALLOWED"
  });
  await expectError(client, "command_backdated_expired_grant", async () => {
    await client.query(
      `update card_access_grants
          set expires_at = now() - interval '1 day'
        where grant_id = 'grant-test'`
    );
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
         'command-backdated-expired-grant', repeat('b', 64), null, 'user',
         'user-test', null, null, 'session-test', 'grant-test',
         'authz-expired-grant', 'communications:request_callback',
         'communications-permissions-v1', 'communications-policy-v1',
         'reserved', now() - interval '2 days', null, now() + interval '1 day'
      )`
    );
  });

  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-long-transaction-grant-expiry",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: commandAuthorizationMetadata({
      operation: "request_callback",
      requiredPermission: "communications:request_callback",
      requestHash: "9".repeat(64),
      scopeId: "card-test",
      scopeType: "card",
      sessionId: "session-test",
      cardGrantId: "grant-test"
    }),
    reasonCode: "COMMAND_ALLOWED"
  });
  await expectError(client, "command_long_transaction_expired_grant", async () => {
    await client.query(
      `update card_access_grants
          set expires_at = clock_timestamp() + interval '300 milliseconds'
        where grant_id = 'grant-test'`
    );
    await delay(700);
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', 'card-test', 'card', 'card-test', 'request_callback',
         'command-long-transaction-expired-grant', repeat('9', 64), null,
         'user', 'user-test', null, null, 'session-test', 'grant-test',
         'authz-long-transaction-grant-expiry',
         'communications:request_callback', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now() - interval '2 days',
         null, clock_timestamp() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_reopen_completed_result", async () => {
    await client.query(
      `update communication_command_idempotency_keys
          set status = 'reserved',
              completed_at = null
        where idempotency_key = 'command-test'`
    );
  });

  await expectError(client, "command_service_cross_tenant", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'tenant', 'tenant-test', 'apply_tenant_kill_switch',
         'command-cross-tenant-service', repeat('6', 64), null, 'service', null,
         'communications-service-other', null, null, null, 'authz-deny',
         'communications:tenant:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_service_unprivileged", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'tenant', 'tenant-test', 'apply_tenant_kill_switch',
         'command-unprivileged-service', repeat('9', 64), null, 'service', null,
         'communications-service-unprivileged', null, null, null, 'authz-service',
         'communications:tenant:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_service_disabled", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'tenant', 'tenant-test', 'apply_tenant_kill_switch',
         'command-disabled-service', repeat('a', 64), null, 'service', null,
         'communications-service-disabled', null, null, null, 'authz-service',
         'communications:tenant:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_platform_unprivileged", async () => {
    await client.query(
      `insert into communication_command_idempotency_keys (
         tenant_id, card_id, scope_type, scope_id, operation, idempotency_key,
         request_hash, result_communication_id, actor_type, actor_user_id,
         actor_service_id, actor_platform_id, session_id, card_grant_id,
         authorization_decision_id, required_permission, permission_version,
         policy_version, status, created_at, completed_at, expires_at
       ) values (
         'tenant-test', null, 'platform', 'platform', 'apply_platform_kill_switch',
         'command-unprivileged-platform', repeat('b', 64), null, 'platform', null,
         null, 'communications-platform-unprivileged', null, null, 'authz-platform',
         'communications:platform:kill_switch', 'communications-permissions-v1',
         'communications-policy-v1', 'reserved', now(), null, now() + interval '1 day'
       )`
    );
  });

  await expectError(client, "command_authorization_immutable", async () => {
    await client.query(
      `update communication_command_idempotency_keys
          set authorization_decision_id = 'authz-mutated'
        where idempotency_key = 'command-test'`
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

  await insertConsentEvidence(
    client,
    "evidence-consent-cross-card-policy",
    "consent-cross-card-policy",
    "communications-consent-v1",
    { consentPolicyId: "consent-policy-other-card" }
  );
  await expectError(client, "consent_policy_cross_card", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-cross-card-policy', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-other-card', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-cross-card-policy', '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-purpose-policy-mismatch",
    "consent-purpose-policy-mismatch",
    "communications-consent-v3",
    { consentPolicyId: "consent-policy-scheduling" }
  );
  await expectError(client, "consent_policy_purpose_channel_mismatch", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-purpose-policy-mismatch', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-scheduling', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-purpose-policy-mismatch', '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "consent_missing_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-missing-evidence', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         null, now(), now(), null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "consent_nonexistent_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-nonexistent-evidence', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-nonexistent', now(), now(), null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "consent_null_trust_event_evidence", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'evidence-consent-null-trust-event', 'tenant-test', 'card-test',
         'communication-test', 'communications.consent', 'communication-consent-v1',
         'bidayax-c14n-1', 'tenant_artifact_signing',
         'envelope-consent-granted', null,
         '{"channel":"telephony","consentPolicyId":"consent-policy-test","consentReceiptId":"consent-granted","observedAt":"2026-07-25T10:00:00.000Z","effectiveAt":"2026-07-25T10:00:00.000Z","expiresAt":null,"revokedAt":null,"envelopeId":"envelope-consent-granted","participantId":"participant-test","policyVersion":"communications-consent-v1","purpose":"callback","source":"visitor","status":"granted"}'::jsonb,
         now()
      )`
    );
  });

  await expectError(client, "trust_event_missing_envelope_link", async () => {
    await insertConsentEvidence(
      client,
      "evidence-consent-missing-event-envelope",
      "consent-missing-event-envelope",
      "communications-consent-v1",
      { omitTrustEventDetailsFields: ["envelopeId"] }
    );
  });

  await expectError(client, "consent_invalid_verification_receipt", async () => {
    await insertConsentEvidence(
      client,
      "evidence-consent-invalid-verification",
      "consent-invalid-verification",
      "communications-consent-v1",
      { verificationValid: false }
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-wrong-receipt",
    "different-consent-receipt",
    "communications-consent-v1"
  );
  await expectError(client, "consent_wrong_receipt_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-wrong-receipt-evidence', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-wrong-receipt', '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  for (const [field, label] of [
    ["consentReceiptId", "consent_missing_receipt_evidence"],
    ["channel", "consent_missing_channel_evidence"],
    ["purpose", "consent_missing_purpose_evidence"],
    ["participantId", "consent_missing_participant_evidence"],
    ["consentPolicyId", "consent_missing_policy_evidence"],
    ["status", "consent_missing_status_evidence"],
    ["source", "consent_missing_source_evidence"]
  ] as const) {
    await insertConsentEvidence(
      client,
      `evidence-${label}`,
      label,
      "communications-consent-v1",
      { omitEvidenceFields: [field] }
    );
    await expectError(client, label, async () => {
      await client.query(
        `insert into communication_consent_receipts (
           consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
           channel, purpose, status, source, evidence_reference_id, observed_at,
           effective_at, expires_at, revoked_at, metadata
         ) values (
           $1, 'tenant-test', 'card-test', 'participant-test',
           'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
           $2, '2026-07-25T10:00:00.000Z'::timestamptz,
           '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
         )`,
        [label, `evidence-${label}`]
      );
    });
  }

  await insertConsentEvidence(
    client,
    "evidence-consent-missing-policy-version",
    "consent-missing-policy-version",
    "communications-consent-v1",
    { omitEvidenceFields: ["policyVersion"] }
  );
  await expectError(client, "consent_missing_policy_version_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-missing-policy-version', 'tenant-test', 'card-test',
         'participant-test', 'consent-policy-test', 'telephony', 'callback',
         'granted', 'visitor', 'evidence-consent-missing-policy-version',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-null-policy-version",
    "consent-null-policy-version",
    "communications-consent-v1",
    { evidenceOverrides: { policyVersion: null } }
  );
  await expectError(client, "consent_null_policy_version_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-null-policy-version', 'tenant-test', 'card-test',
         'participant-test', 'consent-policy-test', 'telephony', 'callback',
         'granted', 'visitor', 'evidence-consent-null-policy-version',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-wrong-policy-version",
    "consent-wrong-policy-version-evidence",
    "communications-consent-v2"
  );
  await expectError(client, "consent_wrong_policy_version_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-wrong-policy-version-evidence', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-wrong-policy-version', '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-missing-observed-time",
    "consent-missing-observed-time",
    "communications-consent-v1",
    { omitEvidenceFields: ["observedAt"] }
  );
  await expectError(client, "consent_missing_observed_time_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-missing-observed-time', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-missing-observed-time',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-mismatched-observed-time",
    "consent-mismatched-observed-time",
    "communications-consent-v1",
    { observedAt: "2026-07-25T10:05:00.000Z" }
  );
  await expectError(client, "consent_mismatched_observed_time_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-mismatched-observed-time', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-mismatched-observed-time',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-mismatched-effective-time",
    "consent-mismatched-effective-time",
    "communications-consent-v1",
    { effectiveAt: "2026-07-25T10:05:00.000Z" }
  );
  await expectError(client, "consent_mismatched_effective_time_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-mismatched-effective-time', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-mismatched-effective-time',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-missing-expiry",
    "consent-missing-expiry",
    "communications-consent-v1",
    { omitEvidenceFields: ["expiresAt"] }
  );
  await expectError(client, "consent_missing_expiry_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-missing-expiry', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-missing-expiry',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-mismatched-expiry",
    "consent-mismatched-expiry",
    "communications-consent-v1",
    { expiresAt: "2026-07-27T10:00:00.000Z" }
  );
  await expectError(client, "consent_mismatched_expiry_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-mismatched-expiry', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-mismatched-expiry',
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz,
         '2026-07-26T10:00:00.000Z'::timestamptz, null, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-mismatched-revocation",
    "consent-mismatched-revocation",
    "communications-consent-v1",
    {
      effectiveAt: consentRevokedObservedAt,
      observedAt: consentRevokedObservedAt,
      revokedAt: "2026-07-25T08:45:00.000Z",
      status: "revoked"
    }
  );
  await expectError(client, "consent_mismatched_revocation_time_evidence", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-mismatched-revocation', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'revoked', 'visitor',
         'evidence-consent-mismatched-revocation',
         '2026-07-25T08:00:00.000Z'::timestamptz,
         '2026-07-25T08:00:00.000Z'::timestamptz, null,
         '2026-07-25T08:30:00.000Z'::timestamptz, '{}'::jsonb
       )`
    );
  });

  await insertConsentEvidence(
    client,
    "evidence-consent-invalid-chronology",
    "consent-invalid-chronology",
    "communications-consent-v1",
    {
      effectiveAt: "2026-07-25T10:00:00.000Z",
      observedAt: "2026-07-25T09:00:00.000Z"
    }
  );
  await expectError(client, "consent_invalid_chronology", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-invalid-chronology', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
         'evidence-consent-invalid-chronology',
         '2026-07-25T09:00:00.000Z'::timestamptz,
         '2026-07-25T10:00:00.000Z'::timestamptz, null, null, '{}'::jsonb
       )`
    );
  });

  await expectError(client, "consent_revoked_envelope_evidence", async () => {
    await insertConsentEvidence(
      client,
      "evidence-consent-revoked-envelope",
      "consent-revoked-envelope",
      "communications-consent-v1",
      { envelopeStatus: "revoked" }
    );
  });

  await expectError(client, "consent_policy_append_only", async () => {
    await client.query(
      `update communication_consent_policies
          set expires_at = now()
        where consent_policy_id = 'consent-policy-test'`
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

  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-lifecycle-invalid",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: lifecycleAuthorizationMetadata({
      communicationId: "communication-test",
      fromState: "policy_checking",
      toState: "active"
    }),
    reasonCode: "LIFECYCLE_ALLOWED"
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
         'authz-lifecycle-invalid', now(), '{}'::jsonb
       )`
    );
  });

  await insertAuthorizationDecision(client, {
    actorType: "user",
    actorUserId: "user-test",
    auditEventId: "authz-lifecycle-authorized",
    cardId: "card-test",
    communicationId: "communication-test",
    metadata: lifecycleAuthorizationMetadata({
      communicationId: "communication-test",
      fromState: "policy_checking",
      toState: "authorized"
    }),
    reasonCode: "LIFECYCLE_ALLOWED"
  });
  await expectError(client, "lifecycle_backdated_transition", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-backdated', 'tenant-test', 'card-test', 'communication-test', 2,
         'policy_checking', 'authorized', 'BACKDATED', 'user-test',
         'authz-lifecycle-authorized', now() - interval '1 day', '{}'::jsonb
       )`
    );
  });

  await expectError(client, "lifecycle_missing_authz", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-missing-authz', 'tenant-test', 'card-test', 'communication-test', 2,
         'policy_checking', 'authorized', 'MISSING_AUTHZ', 'user-test',
         'authz-missing-lifecycle', now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "lifecycle_wrong_operation_authz", async () => {
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
         'transition-wrong-operation-authz', 'tenant-test', 'card-test',
         'communication-test', 2, 'policy_checking', 'authorized',
         'WRONG_OPERATION_AUTHZ', 'user-test', 'authz-allow',
         now(), '{}'::jsonb
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

  await expectError(client, "communication_invalid_initial_state", async () => {
    await client.query(
      `insert into communications (
         communication_id, tenant_id, card_id, structure_version, channel,
         direction, current_state, state_version, request_reason,
         data_classification, retention_class, adapter_reference_id, metadata,
         created_at, updated_at
       ) values (
         'communication-invalid-initial', 'tenant-test', 'card-test', '1', 'telephony',
         'outbound', 'completed', 0, 'callback_completed',
         'internal_operational_metadata', 'operational', null, '{}'::jsonb,
         now(), now()
       )`
    );
  });

  await expectError(client, "communication_direct_state_update", async () => {
    await client.query(
      `update communications
          set current_state = 'authorized',
              state_version = 2,
              updated_at = now()
        where communication_id = 'communication-test'`
    );
  });

  await expectError(client, "communication_forged_lifecycle_setting", async () => {
    await client.query(
      `select set_config('bidayax.communication_lifecycle_transition', 'true', true)`
    );
    await client.query(
      `update communications
          set current_state = 'authorized',
              state_version = 2,
              updated_at = now()
        where communication_id = 'communication-test'`
    );
  });

  await expectError(client, "direct_terminal_transition", async () => {
    await insertAuthorizationDecision(client, {
      actorType: "user",
      actorUserId: "user-test",
      auditEventId: "authz-lifecycle-terminal",
      cardId: "card-test",
      communicationId: "communication-terminal",
      metadata: lifecycleAuthorizationMetadata({
        communicationId: "communication-terminal",
        fromState: "requested",
        toState: "completed"
      }),
      reasonCode: "LIFECYCLE_ALLOWED"
    });
    await client.query(
      `insert into communication_lifecycle_transitions (
         transition_id, tenant_id, card_id, communication_id, sequence_number,
         from_state, to_state, reason_code, actor_user_id,
         authorization_decision_id, occurred_at, metadata
       ) values (
          'transition-terminal-reentry', 'tenant-test', 'card-test',
          'communication-terminal', 1, 'requested', 'completed', 'TERMINAL_REENTRY',
          'user-test', 'authz-lifecycle-terminal', now(), '{}'::jsonb
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

  await insertConsentEvidence(
    client,
    "evidence-consent-ambiguous",
    "consent-ambiguous",
    "communications-consent-v1"
  );
  await expectError(client, "dispatch_ambiguous_consent", async () => {
    await client.query(
      `insert into communication_consent_receipts (
         consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
         channel, purpose, status, source, evidence_reference_id, observed_at,
         effective_at, expires_at, revoked_at, metadata
       ) values (
         'consent-ambiguous', 'tenant-test', 'card-test', 'participant-test',
         'consent-policy-test', 'telephony', 'callback', 'granted', 'visitor',
          'evidence-consent-ambiguous', '2026-07-25T10:00:00.000Z'::timestamptz,
          '2026-07-25T10:00:00.000Z'::timestamptz, null, null,
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
         null, now(), now() + interval '1 day', null, null, null
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

  await expectError(client, "dispatch_authorization_fields_immutable", async () => {
    await client.query(
      `update communication_dispatch_attempts
          set consent_receipt_id = 'consent-expired',
              updated_at = now()
        where attempt_id = 'dispatch-update-consent-test'`
    );
  });

  await expectError(client, "dispatch_stale_policy", async () => {
    await client.query(
      `insert into communication_dispatch_attempts (
         attempt_id, tenant_id, card_id, communication_id, participant_id,
         purpose, consent_receipt_id, suppression_id, command_operation,
         command_idempotency_key, adapter_id, channel, state, retry_count,
         provider_dispatch_enabled, provider_reference_id, failure_reason_code,
         next_retry_at, created_at, updated_at
       ) values (
         'dispatch-stale-policy', 'tenant-test', 'card-test', 'communication-test',
         'participant-test', 'callback', 'consent-stale-policy', null,
         'request_callback', 'command-test', 'telephony-adapter-disabled',
         'telephony', 'queued', 0, false, null, null, null,
         now() - interval '2 hours', now() - interval '2 hours'
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
       null, now(), now() + interval '1 day', null, null, null
     )`
  );

  await expectError(client, "suppression_scope_immutable", async () => {
    await client.query(
      `update communication_suppressions
          set purpose = 'support'
        where suppression_id = 'suppression-test'`
    );
  });

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

  await expectError(client, "suppression_release_missing_audit", async () => {
    await client.query(
      `update communication_suppressions
          set status = 'released',
              released_by_actor_id = 'user-test',
              released_at = now(),
              release_reason = 'owner verified callback preference changed',
              audit_event_id = 'audit-suppression-release-missing'
        where suppression_id = 'suppression-test'`
    );
  });

  await client.query(
    `insert into communication_audit_events (
       audit_event_id, tenant_id, card_id, communication_id, event_type,
       actor_type, actor_user_id, actor_service_id, actor_platform_id,
       authorization_decision_id, permission_version, policy_version, result,
       reason_code, occurred_at, metadata
      ) values (
        'audit-suppression-release', 'tenant-test', 'card-test', 'communication-test',
        'communication.suppression_released', 'user', 'user-test', null, null,
        'authz-release_suppression', 'communications-permissions-v1', 'communications-policy-v1',
        'succeeded', 'SUPPRESSION_RELEASED', now(),
        '{"reasonCode":"SUPPRESSION_RELEASED","sessionId":"session-test","cardGrantId":"grant-test","requiredPermission":"communications:release_suppression","suppressionId":"suppression-test","releaseReason":"owner verified callback preference changed","decisionId":"authz-release_suppression"}'::jsonb
      )`
  );
  await client.query(
    `update communication_suppressions
        set status = 'released',
            released_by_actor_id = 'user-test',
            released_at = now(),
            release_reason = 'owner verified callback preference changed',
            audit_event_id = 'audit-suppression-release'
      where suppression_id = 'suppression-test'`
  );

  await expectError(client, "suppression_double_release", async () => {
    await client.query(
      `update communication_suppressions
          set release_reason = 'second release attempt'
        where suppression_id = 'suppression-test'`
    );
  });

  await expectError(client, "suppression_release_audit_reuse", async () => {
    await client.query(
      `insert into communication_suppressions (
         suppression_id, tenant_id, card_id, participant_id, channel, purpose,
         status, reason_code, created_by_actor_id, released_by_actor_id,
         created_at, expires_at, released_at, release_reason, audit_event_id
       ) values (
         'suppression-audit-reuse', 'tenant-test', 'card-test', 'participant-test',
         'telephony', 'callback', 'active', 'USER_SUPPRESSED', 'user-test',
         null, now(), now() + interval '1 day', null, null, null
       )`
    );
    await client.query(
      `update communication_suppressions
          set status = 'released',
              released_by_actor_id = 'user-test',
              released_at = now(),
              release_reason = 'owner verified callback preference changed',
              audit_event_id = 'audit-suppression-release'
        where suppression_id = 'suppression-audit-reuse'`
    );
  });

  await expectError(client, "suppression_release_wrong_reason", async () => {
    await client.query(
      `insert into communication_suppressions (
         suppression_id, tenant_id, card_id, participant_id, channel, purpose,
         status, reason_code, created_by_actor_id, released_by_actor_id,
         created_at, expires_at, released_at, release_reason, audit_event_id
       ) values (
         'suppression-wrong-reason', 'tenant-test', 'card-test', 'participant-test',
         'telephony', 'callback', 'active', 'USER_SUPPRESSED', 'user-test',
         null, now(), now() + interval '1 day', null, null, null
       )`
    );
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, actor_service_id, actor_platform_id,
         authorization_decision_id, permission_version, policy_version, result,
         reason_code, occurred_at, metadata
        ) values (
          'audit-suppression-wrong-reason', 'tenant-test', 'card-test', 'communication-test',
          'communication.suppression_released', 'user', 'user-test', null, null,
          'authz-release_suppression', 'communications-permissions-v1', 'communications-policy-v1',
          'succeeded', 'SUPPRESSION_RELEASED', now(),
          '{"reasonCode":"SUPPRESSION_RELEASED","sessionId":"session-test","cardGrantId":"grant-test","requiredPermission":"communications:release_suppression","suppressionId":"suppression-wrong-reason","releaseReason":"different release reason","decisionId":"authz-release_suppression"}'::jsonb
        )`
    );
    await client.query(
      `update communication_suppressions
          set status = 'released',
              released_by_actor_id = 'user-test',
              released_at = now(),
              release_reason = 'owner verified callback preference changed',
              audit_event_id = 'audit-suppression-wrong-reason'
        where suppression_id = 'suppression-wrong-reason'`
    );
  });

  await client.query(
    `insert into communication_dispatch_attempts (
       attempt_id, tenant_id, card_id, communication_id, participant_id,
       purpose, consent_receipt_id, suppression_id, command_operation,
       command_idempotency_key, adapter_id, channel, state, retry_count,
       provider_dispatch_enabled, provider_reference_id, failure_reason_code,
       next_retry_at, created_at, updated_at
     ) values (
       'dispatch-after-suppression-release', 'tenant-test', 'card-test',
       'communication-test', 'participant-test', 'callback', 'consent-granted',
       null, 'request_callback', 'command-test', 'telephony-adapter-disabled',
       'telephony', 'queued', 0, false, null, null, null,
       now() + interval '2 seconds', now() + interval '2 seconds'
     )`
  );

  await insertConsentEvidence(
    client,
    "evidence-consent-revoked",
    "consent-revoked",
    "communications-consent-v1",
    {
      effectiveAt: consentRevokedObservedAt,
      observedAt: consentRevokedObservedAt,
      revokedAt: consentRevokedAt,
      status: "revoked"
    }
  );
  await client.query(
    `insert into communication_consent_receipts (
       consent_receipt_id, tenant_id, card_id, participant_id, consent_policy_id,
       channel, purpose, status, source, evidence_reference_id, observed_at,
       effective_at, expires_at, revoked_at, metadata
     ) values (
       'consent-revoked', 'tenant-test', 'card-test', 'participant-test',
       'consent-policy-test', 'telephony', 'callback', 'revoked', 'visitor',
       'evidence-consent-revoked', '2026-07-25T08:00:00.000Z'::timestamptz,
       '2026-07-25T08:00:00.000Z'::timestamptz, null,
       '2026-07-25T08:30:00.000Z'::timestamptz, '{"reasonCode":"CONSENT_REVOKED"}'::jsonb
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
         false, null, null, null, now() + interval '3 seconds', now() + interval '3 seconds'
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
    `insert into communication_business_hours_policies (
       business_hours_policy_id, tenant_id, card_id, policy_version, status,
       timezone, weekly_windows, exception_windows, fallback_action, created_at,
       updated_at
     ) values (
       'business-hours-test', 'tenant-test', 'card-test', 'business-hours-v1',
       'active', 'America/New_York',
       '[{"day":"monday","opens":"09:00","closes":"17:00"}]'::jsonb,
       '[]'::jsonb, 'queue', now(), now()
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

  await expectError(client, "receptionist_unowned_interaction_reference", async () => {
    await client.query(
      `insert into communication_receptionist_sessions (
         receptionist_session_id, tenant_id, card_id, communication_id,
         receptionist_interaction_id, language, escalation_state,
         can_dispatch_providers_directly, safe_summary_hash, created_at, updated_at
       ) values (
         'receptionist-session-unowned-reference', 'tenant-test', 'card-test',
         'communication-test', '11111111-1111-4111-8111-111111111111',
         'en-US', 'none', false, repeat('8', 64), now(), now()
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
  await expectError(client, "adapter_health_sensitive_reason_code", async () => {
    await client.query(
      `insert into communication_adapter_health (
         adapter_health_id, tenant_id, adapter_id, channel, status, checked_at,
         reason_codes, sanitized_metadata
       ) values (
         'adapter-health-sensitive-reason', 'tenant-test', 'telephony-adapter-disabled',
         'telephony', 'degraded', now(), '["+15555550123"]'::jsonb, '{}'::jsonb
        )`
    );
  });
  for (const [label, reasonCodes] of [
    ["adapter_health_non_string_reason_code", "[123]"],
    ["adapter_health_nested_reason_code", "[{\"code\":\"DEGRADED\"}]"],
    ["adapter_health_prose_reason_code", "[\"degraded because dependency timed out\"]"],
    [
      "adapter_health_oversized_reason_code",
      "[\"REASON_CODE_VALUE_THAT_IS_INTENTIONALLY_LONGER_THAN_SIXTY_FOUR_CHARACTERS\"]"
    ]
  ] as const) {
    await expectError(client, label, async () => {
      await client.query(
        `insert into communication_adapter_health (
           adapter_health_id, tenant_id, adapter_id, channel, status, checked_at,
           reason_codes, sanitized_metadata
         ) values (
           $1, 'tenant-test', 'telephony-adapter-disabled',
           'telephony', 'degraded', now(), $2::jsonb, '{}'::jsonb
          )`,
        [label, reasonCodes]
      );
    });
  }
  await client.query(
    `insert into communication_summaries (
       summary_id, tenant_id, card_id, communication_id, summary_version,
       safe_summary_hash, status, generated_by_actor_type, generated_by_actor_id,
       reason_code, metadata, created_at
     ) values (
       'summary-test', 'tenant-test', 'card-test', 'communication-test',
       'summary-v1', repeat('9', 64), 'available', 'service',
       'communications-service', 'SAFE_SUMMARY_AVAILABLE',
       '{"reasonCode":"SAFE_SUMMARY_AVAILABLE"}'::jsonb, now()
     )`
  );
  await client.query(
    `insert into communication_failover_events (
       failover_event_id, tenant_id, card_id, communication_id, from_adapter_id,
       to_adapter_id, channel, reason_code, decision, provider_dispatch_enabled,
       occurred_at, metadata
     ) values (
       'failover-test', 'tenant-test', 'card-test', 'communication-test',
       'telephony-adapter-disabled', null, 'telephony', 'NO_FAILOVER_REQUIRED',
       'not_required', false, now(), '{"reasonCode":"NO_FAILOVER_REQUIRED"}'::jsonb
     )`
  );

  await expectError(client, "business_hours_sensitive_window", async () => {
    await client.query(
      `insert into communication_business_hours_policies (
         business_hours_policy_id, tenant_id, card_id, policy_version, status,
         timezone, weekly_windows, exception_windows, fallback_action, created_at,
         updated_at
       ) values (
         'business-hours-sensitive', 'tenant-test', 'card-test', 'business-hours-v2',
         'active', 'America/New_York',
         '[{"phone":"+15555550123"}]'::jsonb, '[]'::jsonb, 'queue', now(), now()
       )`
    );
  });

  await expectError(client, "summary_null_card_bypass", async () => {
    await client.query(
      `insert into communication_summaries (
         summary_id, tenant_id, card_id, communication_id, summary_version,
         safe_summary_hash, status, generated_by_actor_type, generated_by_actor_id,
         reason_code, metadata, created_at
       ) values (
         'summary-null-card', 'tenant-test', null, 'communication-test',
         'summary-v2', repeat('9', 64), 'available', 'service',
         'communications-service', 'NULL_CARD_BYPASS', '{}'::jsonb, now()
       )`
    );
  });

  await expectError(client, "summary_forged_actor", async () => {
    await client.query(
      `insert into communication_summaries (
         summary_id, tenant_id, card_id, communication_id, summary_version,
         safe_summary_hash, status, generated_by_actor_type, generated_by_actor_id,
         reason_code, metadata, created_at
       ) values (
         'summary-forged-actor', 'tenant-test', 'card-test', 'communication-test',
         'summary-v2', repeat('9', 64), 'available', 'service',
         'communications-service-missing', 'FORGED_ACTOR', '{}'::jsonb, now()
       )`
    );
  });

  await expectError(client, "summary_missing_user_grant", async () => {
    await client.query(
      `insert into communication_summaries (
         summary_id, tenant_id, card_id, communication_id, summary_version,
         safe_summary_hash, status, generated_by_actor_type, generated_by_actor_id,
         reason_code, metadata, created_at
       ) values (
         'summary-missing-user-grant', 'tenant-test', 'card-test', 'communication-test',
         'summary-v2', repeat('9', 64), 'available', 'user',
         'user-test', 'MISSING_GRANT',
         '{"sessionId":"session-test","requiredPermission":"communications:query_communication_status"}'::jsonb,
         now()
       )`
    );
  });

  await expectError(client, "summary_append_only", async () => {
    await client.query(
      `update communication_summaries
          set status = 'withheld'
        where summary_id = 'summary-test'`
    );
  });

  await expectError(client, "failover_provider_enabled", async () => {
    await client.query(
      `insert into communication_failover_events (
         failover_event_id, tenant_id, card_id, communication_id, from_adapter_id,
         to_adapter_id, channel, reason_code, decision, provider_dispatch_enabled,
         occurred_at, metadata
       ) values (
         'failover-provider-enabled', 'tenant-test', 'card-test', 'communication-test',
         'telephony-adapter-disabled', null, 'telephony', 'PROVIDER_ENABLED',
         'adapter_changed', true, now(), '{}'::jsonb
       )`
    );
  });

  await expectError(client, "failover_append_only", async () => {
    await client.query(
      `delete from communication_failover_events
        where failover_event_id = 'failover-test'`
    );
  });

  await client.query(
    `insert into cryptographic_envelopes (
       envelope_id, tenant_id, structure_version, envelope_version, card_id,
       artifact_type, artifact_id, artifact_version, domain, schema_version,
       canonicalization_version, algorithm_policy_version, digest_algorithm,
       digest_operation, digest, signature_algorithm, signature_operation,
       key_id, key_version, key_purpose, signer_type, signer_id, signed_at,
       expires_at, previous_envelope_id, previous_digest, provenance_manifest_id,
       metadata, status, payload, signature, immutable, created_at
     ) values (
       'envelope-test', 'tenant-test', '1', '1', 'card-test',
       'communication-webhook-evidence-v1', 'communication-test', '1',
       'communications.webhook', 'communication-webhook-evidence-v1',
       'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
       'digest', repeat('a', 64), 'Ed25519', 'signature',
       'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
       'communications-service', now(), null, null, null, null,
       '{}'::jsonb, 'active',
       '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
       'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
     )`
  );
  await client.query(
    `insert into trust_events (
       event_id, tenant_id, structure_version, stream_id, event_type,
       provenance_lifecycle, subject_type, subject_id, actor_identity_id,
       occurred_at, idempotency_key, details
     ) values (
       'trust-event-test', 'tenant-test', '1', 'communications-trust',
       'communications.webhook', 'created', 'communications.webhook',
       'communication-test', 'communications-service', now(),
       'trust-event-idempotency-test',
       '{"envelopeId":"envelope-test","payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb
     )`
  );
  await client.query(
    `insert into cryptographic_envelopes (
       envelope_id, tenant_id, structure_version, envelope_version, card_id,
       artifact_type, artifact_id, artifact_version, domain, schema_version,
       canonicalization_version, algorithm_policy_version, digest_algorithm,
       digest_operation, digest, signature_algorithm, signature_operation,
       key_id, key_version, key_purpose, signer_type, signer_id, signed_at,
       expires_at, previous_envelope_id, previous_digest, provenance_manifest_id,
       metadata, status, payload, signature, immutable, created_at
     ) values
       (
        'envelope-sensitive-trust-field', 'tenant-test', '1', '1', 'card-test',
        'communication-webhook-evidence-v1', 'communication-test', '1',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('f', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'active', '{"rawTranscript":"redacted-test-sentinel"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       ),
       (
        'envelope-unexpected-trust-field', 'tenant-test', '1', '1', 'card-test',
        'communication-webhook-evidence-v1', 'communication-test', '1',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('0', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'active', '{"safeButUnexpected":"value"}'::jsonb,
       'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       )`
  );
  await client.query(
    `insert into trust_verification_receipts (
       receipt_id, tenant_id, structure_version, envelope_id, verifier_identity_id,
       verified_at, valid, components, reason_codes, warnings, idempotency_key
     )
     select 'verification-' || envelope_id, tenant_id, '1', envelope_id,
            'communications-service', now(), true,
            '{"signature":"valid","domain":"communications.webhook"}'::jsonb,
            '["VALID"]'::jsonb, '[]'::jsonb,
            'verification-' || envelope_id || '-idempotency'
       from cryptographic_envelopes
      where tenant_id = 'tenant-test'
        and envelope_id in (
          'envelope-test',
          'envelope-sensitive-trust-field',
          'envelope-unexpected-trust-field'
        )`
  );
  await client.query(
    `insert into trust_events (
       event_id, tenant_id, structure_version, stream_id, event_type,
       provenance_lifecycle, subject_type, subject_id, actor_identity_id,
       occurred_at, idempotency_key, details
     ) values
       ('trust-event-sensitive-trust-field', 'tenant-test', '1', 'communications-trust',
        'communications.webhook', 'created', 'communications.webhook',
        'communication-test', 'communications-service', now(),
        'trust-event-sensitive-trust-field-idempotency',
        '{"envelopeId":"envelope-sensitive-trust-field","payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb),
       ('trust-event-unexpected-trust-field', 'tenant-test', '1', 'communications-trust',
        'communications.webhook', 'created', 'communications.webhook',
        'communication-test', 'communications-service', now(),
        'trust-event-unexpected-trust-field-idempotency',
        '{"envelopeId":"envelope-unexpected-trust-field","payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb)`
  );

  await client.query(
    `insert into communication_trust_evidence_references (
       trust_evidence_reference_id, tenant_id, card_id, communication_id,
       domain, artifact_schema, canonicalization_version, key_purpose,
       envelope_id, trust_event_id, evidence_fields, recorded_at
      ) values (
        'trust-ref-test', 'tenant-test', 'card-test', 'communication-test',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'tenant_artifact_signing', 'envelope-test', 'trust-event-test',
        '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
        now()
      )`
  );

  await client.query(
    `insert into cryptographic_envelopes (
       envelope_id, tenant_id, structure_version, envelope_version, card_id,
       artifact_type, artifact_id, artifact_version, domain, schema_version,
       canonicalization_version, algorithm_policy_version, digest_algorithm,
       digest_operation, digest, signature_algorithm, signature_operation,
       key_id, key_version, key_purpose, signer_type, signer_id, signed_at,
       expires_at, previous_envelope_id, previous_digest, provenance_manifest_id,
       metadata, status, payload, signature, immutable, created_at
     ) values
       (
        'envelope-trust-revoked', 'tenant-test', '1', '1', 'card-test',
        'communication-webhook-evidence-v1', 'communication-test', '1',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('1', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'revoked',
        '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       ),
       (
        'envelope-trust-superseded', 'tenant-test', '1', '1', 'card-test',
        'communication-webhook-evidence-v1', 'communication-test', '1',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('2', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now(), null, null, null, null,
        '{}'::jsonb, 'superseded',
        '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       ),
       (
        'envelope-trust-expired', 'tenant-test', '1', '1', 'card-test',
        'communication-webhook-evidence-v1', 'communication-test', '1',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('3', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now() - interval '2 hours', now() - interval '1 hour', null, null, null,
        '{}'::jsonb, 'active',
        '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       ),
       (
        'envelope-trust-future-signed', 'tenant-test', '1', '1', 'card-test',
        'communication-webhook-evidence-v1', 'communication-test', '1',
        'communications.webhook', 'communication-webhook-evidence-v1',
        'bidayax-c14n-1', 'trust-algorithm-policy-1', 'SHA-256',
        'digest', repeat('4', 64), 'Ed25519', 'signature',
        'communications-trust-key', 1, 'tenant_artifact_signing', 'system',
        'communications-service', now() + interval '1 hour', null, null, null, null,
        '{}'::jsonb, 'active',
        '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
       'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', true, now()
       )`
  );
  await client.query(
    `insert into trust_verification_receipts (
       receipt_id, tenant_id, structure_version, envelope_id, verifier_identity_id,
       verified_at, valid, components, reason_codes, warnings, idempotency_key
     )
     select 'verification-' || envelope_id, tenant_id, '1', envelope_id,
            'communications-service', now(), true,
            '{"signature":"valid","domain":"communications.webhook"}'::jsonb,
            '["VALID"]'::jsonb, '[]'::jsonb,
            'verification-' || envelope_id || '-idempotency'
       from cryptographic_envelopes
      where tenant_id = 'tenant-test'
        and envelope_id in (
          'envelope-trust-revoked',
          'envelope-trust-superseded',
          'envelope-trust-expired',
          'envelope-trust-future-signed'
        )`
  );

  await expectError(client, "trust_missing_durable_link", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-missing-link', 'tenant-test', 'card-test', 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'tenant_artifact_signing', null, null,
         '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
         now()
       )`
    );
  });

  await expectError(client, "trust_wrong_key_purpose", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-wrong-key-purpose', 'tenant-test', 'card-test', 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'provider_webhook_signing', 'envelope-test', 'trust-event-test',
         '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
         now()
       )`
    );
  });

  await expectError(client, "trust_null_card_bypass", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-null-card', 'tenant-test', null, 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'tenant_artifact_signing', 'envelope-test', 'trust-event-test',
         '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
         now()
       )`
    );
  });

  await expectError(client, "trust_payload_projection_mismatch", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-payload-mismatch', 'tenant-test', 'card-test',
         'communication-test', 'communications.webhook',
         'communication-webhook-evidence-v1', 'bidayax-c14n-1',
         'tenant_artifact_signing', 'envelope-test', 'trust-event-test',
         '{"payloadHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}'::jsonb,
         now()
       )`
    );
  });

  for (const [label, envelopeId] of [
    ["trust_revoked_envelope", "envelope-trust-revoked"],
    ["trust_superseded_envelope", "envelope-trust-superseded"],
    ["trust_expired_envelope", "envelope-trust-expired"],
    ["trust_signed_after_recorded", "envelope-trust-future-signed"]
  ] as const) {
    await expectError(client, label, async () => {
      await client.query(
        `insert into communication_trust_evidence_references (
           trust_evidence_reference_id, tenant_id, card_id, communication_id,
           domain, artifact_schema, canonicalization_version, key_purpose,
           envelope_id, trust_event_id, evidence_fields, recorded_at
         ) values (
           $1, 'tenant-test', 'card-test', 'communication-test',
           'communications.webhook', 'communication-webhook-evidence-v1',
           'bidayax-c14n-1', 'tenant_artifact_signing', $2, 'trust-event-test',
           '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
           now()
         )`,
        [`trust-ref-${label}`, envelopeId]
      );
    });
  }

  await expectError(client, "trust_sensitive_metadata", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-sensitive', 'tenant-test', 'card-test', 'communication-test',
         'communications.webhook', 'communication-webhook-evidence-v1',
         'bidayax-c14n-1', 'tenant_artifact_signing',
         'envelope-sensitive-trust-field', 'trust-event-sensitive-trust-field',
         '{"rawTranscript":"redacted-test-sentinel"}'::jsonb, now()
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
         'bidayax-c14n-1', 'tenant_artifact_signing',
         'envelope-unexpected-trust-field', 'trust-event-unexpected-trust-field',
         '{"safeButUnexpected":"value"}'::jsonb, now()
       )`
    );
  });

  await expectError(client, "trust_domain_schema_mismatch", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-domain-schema-mismatch', 'tenant-test', 'card-test',
         'communication-test', 'communications.audit',
         'communication-webhook-evidence-v1', 'bidayax-c14n-1',
         'tenant_artifact_signing', 'envelope-test', 'trust-event-test',
         '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
         now()
       )`
    );
  });

  await client.query(
    `insert into trust_events (
       event_id, tenant_id, structure_version, stream_id, event_type,
       provenance_lifecycle, subject_type, subject_id, actor_identity_id,
       occurred_at, idempotency_key, details
     ) values (
       'trust-event-mismatch', 'tenant-test', '1', 'communications-trust',
       'communications.audit', 'created', 'communications.audit',
       'communication-test', 'communications-service', now(),
       'trust-event-idempotency-mismatch', '{}'::jsonb
     )`
  );

  await expectError(client, "trust_event_mismatch", async () => {
    await client.query(
      `insert into communication_trust_evidence_references (
         trust_evidence_reference_id, tenant_id, card_id, communication_id,
         domain, artifact_schema, canonicalization_version, key_purpose,
         envelope_id, trust_event_id, evidence_fields, recorded_at
       ) values (
         'trust-ref-event-mismatch', 'tenant-test', 'card-test',
         'communication-test', 'communications.webhook',
         'communication-webhook-evidence-v1', 'bidayax-c14n-1',
         'tenant_artifact_signing', 'envelope-test', 'trust-event-mismatch',
         '{"payloadHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'::jsonb,
         now()
       )`
    );
  });

  await expectError(client, "audit_null_card_bypass", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, actor_service_id, actor_platform_id,
         authorization_decision_id, permission_version, policy_version, result,
         reason_code, occurred_at, metadata
        ) values (
          'audit-null-card', 'tenant-test', null, 'communication-test',
          'communication.denied', 'user', 'user-test', null, null, 'authz-deny',
          'communications-permissions-v1', 'communications-policy-v1',
          'denied', 'NULL_CARD_BYPASS', now(), '{}'::jsonb
        )`
    );
  });

  await expectError(client, "audit_sensitive_metadata", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, actor_service_id, actor_platform_id,
         authorization_decision_id, permission_version, policy_version, result,
         reason_code, occurred_at, metadata
        ) values (
          'audit-sensitive', 'tenant-test', 'card-test', 'communication-test',
          'communication.denied', 'user', 'user-test', null, null, 'authz-deny',
          'communications-permissions-v1', 'communications-policy-v1',
          'denied', 'RAW_DATA_REJECTED', now(),
          '{"sessionId":"session-test","cardGrantId":"grant-test","requiredPermission":"communications:request_callback","email":"caller@example.test"}'::jsonb
        )`
    );
  });

  await expectError(client, "audit_user_without_actor", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, actor_service_id, actor_platform_id,
         authorization_decision_id, permission_version, policy_version, result,
         reason_code, occurred_at, metadata
        ) values (
          'audit-user-without-actor', 'tenant-test', 'card-test', 'communication-test',
          'communication.denied', 'user', null, null, null, 'authz-deny',
          'communications-permissions-v1', 'communications-policy-v1',
          'denied', 'MISSING_ACTOR', now(), '{}'::jsonb
        )`
    );
  });

  await expectError(client, "audit_service_disabled", async () => {
    await client.query(
      `insert into communication_audit_events (
         audit_event_id, tenant_id, card_id, communication_id, event_type,
         actor_type, actor_user_id, actor_service_id, actor_platform_id,
         authorization_decision_id, permission_version, policy_version, result,
         reason_code, occurred_at, metadata
        ) values (
          'audit-disabled-service', 'tenant-test', 'card-test', 'communication-test',
          'communication.denied', 'service', null, 'communications-service-disabled',
          null, 'authz-deny', 'communications-permissions-v1',
          'communications-policy-v1', 'denied', 'DISABLED_SERVICE', now(), '{}'::jsonb
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
    `complete migration chain applied to disposable/test schema (${migrationFiles.length} files)`,
    "all 18 Communications data-model tables exist",
    "tenant/card composite endpoint relationships reject cross-card and cross-tenant rows",
    "null-card bypass attempts are rejected across child and reference rows",
    "command idempotency rejects duplicate requests, enforces registered operations, and permits only controlled terminal result updates",
    "user, service, tenant-scope, and platform-scope command authorization shapes are enforced",
    "forged actors, cross-tenant service actors, revoked sessions, and revoked grants are rejected",
    "lifecycle transitions advance state with append-only optimistic sequencing and guard aggregate state updates",
    "invalid, direct terminal, and invalid initial lifecycle states are rejected",
    "queued dispatch requires active cited consent and a still-active cited policy at evaluation time",
    "consent receipts reject missing evidence, cross-card policies, and channel/purpose-mismatched policies",
    "consent trust evidence must bind observed, effective, expiry, and revocation timing exactly",
    "missing, expired, revoked, ambiguous, and stale-policy consent deny insert and update dispatch paths",
    "active suppressions deny insert and update dispatch paths under serialized policy locks",
    "provider dispatch remains disabled",
    "webhook evidence rejects raw body retention and sensitive metadata",
    "business-hours, summary, and failover evidence tables exist and reject unsafe or mutable evidence",
    "trust evidence rejects sensitive, non-allowlisted, and trust-domain-incompatible references",
    "audit events reject sensitive metadata and invalid actor shapes",
    "audit, lifecycle, consent, suppression, summary, and failover evidence are append-only",
    "communication tables contain no credential, token, raw payload, transcript, or audio columns"
  ];
}

let connectionString = "";
let client: PgClient | null = null;
let verificationTransactionStarted = false;
let completion: VerificationCompletion | null = null;

try {
  verifyDatabaseUrlSafety();
  connectionString = await resolveConnectionString();
  client = new Client({ connectionString });
  await client.connect();
  const migrationFiles = await applyMigrations(client);
  await client.query("BEGIN");
  verificationTransactionStarted = true;
  const details = await runVerification(client, migrationFiles, connectionString);
  await client.query("ROLLBACK");
  verificationTransactionStarted = false;
  finish("passed", details);
} catch (error) {
  if (error instanceof VerificationCompletion) {
    completion = error;
  } else if (verificationTransactionStarted && client) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback failures during connection or setup errors.
    }

    completion = new VerificationCompletion(
      "failed",
      JSON.stringify({
        component: "communications-data-model-postgres-verifier",
        details: [error instanceof Error ? error.message : String(error)],
        event: "communications_data_model_postgres_verification_completed",
        status: "failed"
      })
    );
  } else {
    completion = new VerificationCompletion(
      "failed",
      JSON.stringify({
        component: "communications-data-model-postgres-verifier",
        details: [error instanceof Error ? error.message : String(error)],
        event: "communications_data_model_postgres_verification_completed",
        status: "failed"
      })
    );
  }
} finally {
  await client?.end().catch(() => undefined);

  if (disposableContainerStarted) {
    execFileSync(dockerExecutable, ["rm", "-f", containerName], {
      stdio: "ignore"
    });
  }

  if (completion?.status === "passed") {
    console.info(completion.line);
    process.exitCode = 0;
  } else {
    console.error(
      completion?.line ??
        JSON.stringify({
          component: "communications-data-model-postgres-verifier",
          details: ["Verification ended without a completion status."],
          event: "communications_data_model_postgres_verification_completed",
          status: "failed"
        })
    );
    process.exitCode = 1;
  }
}
