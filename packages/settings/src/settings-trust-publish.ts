import type { CardSettingsVersion, SettingsPublishResult } from "@bidayax/types";
import {
  appendAuditChainEntry,
  buildCryptographicEnvelope,
  createDomainDigest,
  createProvenanceEvent,
  createProvenanceManifest,
  internalDigest,
  type AuditChainEntry,
  type CryptographicEnvelope,
  type ProvenanceManifest,
  type SignatureProvider,
  type TrustEvent,
  type TrustKey
} from "@bidayax/trust";
import type { SettingsQueryExecutor } from "./settings-persistence";
import { createSettingsPersistenceRepository } from "./settings-persistence";
import { persistSettingsPublishResult, type PersistSettingsPublishResult } from "./settings-persistence-service";

export type SettingsTrustSigningDependencies = {
  readonly key: TrustKey;
  readonly provider: SignatureProvider;
  readonly signerId: string;
  readonly signerType: "platform" | "tenant" | "system";
};

export type PersistTrustedSettingsPublishInput = {
  readonly executor: SettingsQueryExecutor;
  readonly publishResult: SettingsPublishResult;
  readonly signing: SettingsTrustSigningDependencies | null;
  readonly evidenceRequired: boolean;
  readonly idempotencyKey: string;
  readonly publishedAt: string;
};

export type SettingsTrustEvidence = {
  readonly cryptographicDigest: string;
  readonly envelope: CryptographicEnvelope;
  readonly provenanceManifest: ProvenanceManifest;
  readonly trustEvent: TrustEvent;
  readonly auditEntry: AuditChainEntry;
};

function publishedVersion(result: SettingsPublishResult): CardSettingsVersion {
  if (!result.publishedVersion || result.publishedVersion.status !== "published") throw new Error("A published settings version is required for trust evidence");
  return result.publishedVersion;
}

function settingsTrustPayload(value: unknown): import("@bidayax/trust").CanonicalValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Settings trust payload contains a non-finite number");
    return Number.isInteger(value) ? value : value.toString();
  }
  if (Array.isArray(value)) return value.map(settingsTrustPayload);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, settingsTrustPayload(child)]));
  throw new Error("Settings trust payload contains an unsupported value");
}

async function priorAuditChain(executor: SettingsQueryExecutor, tenantId: string, streamId: string): Promise<readonly AuditChainEntry[]> {
  const result = await executor.query<{ entry: AuditChainEntry }>(
    `select jsonb_build_object(
      'structureVersion', structure_version, 'entryId', entry_id, 'tenantId', tenant_id,
      'streamId', stream_id, 'sequence', sequence_number, 'previousDigest', previous_digest,
      'event', event_payload, 'eventDigest', event_digest, 'entryDigest', entry_digest,
      'checkpoint', case when checkpoint_sequence is null then null else jsonb_build_object('trustedSequence', checkpoint_sequence, 'trustedDigest', checkpoint_digest) end,
      'appendedAt', to_char(appended_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) as entry from trust_audit_chain_entries where tenant_id = $1 and stream_id = $2 order by sequence_number`,
    [tenantId, streamId]
  );
  return result.rows.map((row) => row.entry);
}

async function buildEvidence(input: PersistTrustedSettingsPublishInput): Promise<SettingsTrustEvidence> {
  if (!input.signing) throw new Error("Trust signing dependencies are unavailable");
  const version = publishedVersion(input.publishResult);
  const payload = settingsTrustPayload(version.settingsSnapshot);
  const digest = createDomainDigest({ artifactId: version.versionId, artifactType: "settings_snapshot", artifactVersion: version.versionId, cardId: version.cardId, domain: "settings.snapshot", payload, schemaVersion: "settings-snapshot-1", tenantId: version.tenantId });
  const provenanceEvent = createProvenanceEvent({ actorIdentityId: input.signing.signerId, eventId: `settings-published-${version.versionId}`, lifecycle: "published", metadata: { compatibilitySnapshotHash: version.snapshotHash }, occurredAt: input.publishedAt, priorDigest: null, resultingDigest: digest, safeReference: `ref:settings-version/${version.versionId}` });
  const provenanceManifest = createProvenanceManifest({ artifactDigest: digest, artifactId: version.versionId, artifactType: "settings_snapshot", artifactVersion: version.versionId, createdAt: input.publishedAt, events: [provenanceEvent], links: [], metadata: { compatibilitySnapshotHash: version.snapshotHash }, schemaVersion: "settings-provenance-1", tenantId: version.tenantId });
  const envelope = await buildCryptographicEnvelope({ artifactId: version.versionId, artifactType: "settings_snapshot", artifactVersion: version.versionId, cardId: version.cardId, domain: "settings.snapshot", expiresAt: null, key: input.signing.key, metadata: { compatibilitySnapshotHash: version.snapshotHash }, payload, previousDigest: null, previousEnvelopeId: null, provenanceManifestId: provenanceManifest.manifestId, provider: input.signing.provider, schemaVersion: "settings-snapshot-1", signedAt: input.publishedAt, signerId: input.signing.signerId, signerType: input.signing.signerType, status: "active", tenantId: version.tenantId });
  const streamId = `settings:${version.cardId}`;
  const trustEvent: TrustEvent = { actorIdentityId: input.signing.signerId, details: { cardId: version.cardId, compatibilitySnapshotHash: version.snapshotHash, cryptographicDigest: digest, envelopeId: envelope.envelopeId }, eventId: `trust_${internalDigest("settings-publish-event/v1", "trust-event-1", { tenantId: version.tenantId, cardId: version.cardId, versionId: version.versionId, idempotencyKey: input.idempotencyKey })}`, eventType: "settings.published.signed", idempotencyKey: input.idempotencyKey, occurredAt: input.publishedAt, provenanceLifecycle: "published", streamId, structureVersion: "1", subjectId: version.versionId, subjectType: "settings_snapshot", tenantId: version.tenantId };
  const auditEntry = appendAuditChainEntry({ appendedAt: input.publishedAt, chain: await priorAuditChain(input.executor, version.tenantId, streamId), event: trustEvent, streamId, tenantId: version.tenantId });
  return { auditEntry, cryptographicDigest: digest, envelope, provenanceManifest, trustEvent };
}

async function persistEvidence(executor: SettingsQueryExecutor, evidence: SettingsTrustEvidence): Promise<void> {
  const m = evidence.provenanceManifest; const e = evidence.envelope; const t = evidence.trustEvent; const a = evidence.auditEntry;
  await executor.query(`insert into trust_provenance_manifests (manifest_id,tenant_id,structure_version,artifact_type,artifact_id,artifact_version,artifact_digest,links,lifecycle_events,manifest_digest,schema_version,metadata,created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [m.manifestId,m.tenantId,m.structureVersion,m.artifactType,m.artifactId,m.artifactVersion,m.artifactDigest,m.links,m.events,m.manifestDigest,m.schemaVersion,m.metadata,m.createdAt]);
  await executor.query(`insert into cryptographic_envelopes (envelope_id,tenant_id,structure_version,envelope_version,card_id,artifact_type,artifact_id,artifact_version,domain,schema_version,canonicalization_version,algorithm_policy_version,digest_algorithm,digest,signature_algorithm,key_id,key_version,key_purpose,signer_type,signer_id,signed_at,expires_at,previous_envelope_id,previous_digest,provenance_manifest_id,metadata,status,payload,signature) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`, [e.envelopeId,e.tenantId,e.structureVersion,e.envelopeVersion,e.cardId,e.artifactType,e.artifactId,e.artifactVersion,e.domain,e.schemaVersion,e.canonicalizationVersion,e.algorithmPolicyVersion,e.digestAlgorithm,e.digest,e.signatureAlgorithm,e.keyId,e.keyVersion,e.keyPurpose,e.signerType,e.signerId,e.signedAt,e.expiresAt,e.previousEnvelopeId,e.previousDigest,e.provenanceManifestId,e.metadata,e.status,e.payload,e.signature]);
  await executor.query(`insert into trust_events (event_id,tenant_id,structure_version,stream_id,event_type,provenance_lifecycle,subject_type,subject_id,actor_identity_id,occurred_at,idempotency_key,details) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [t.eventId,t.tenantId,t.structureVersion,t.streamId,t.eventType,t.provenanceLifecycle,t.subjectType,t.subjectId,t.actorIdentityId,t.occurredAt,t.idempotencyKey,t.details]);
  await executor.query(`insert into trust_audit_chain_entries (entry_id,tenant_id,structure_version,stream_id,sequence_number,previous_digest,event_id,event_payload,event_digest,entry_digest,checkpoint_sequence,checkpoint_digest,appended_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [a.entryId,a.tenantId,a.structureVersion,a.streamId,a.sequence,a.previousDigest,a.event.eventId,a.event,a.eventDigest,a.entryDigest,a.checkpoint?.trustedSequence ?? null,a.checkpoint?.trustedDigest ?? null,a.appendedAt]);
}

export async function persistTrustedSettingsPublishTransactionally(input: PersistTrustedSettingsPublishInput): Promise<PersistSettingsPublishResult & { readonly trustEvidence: SettingsTrustEvidence | null }> {
  await input.executor.query("begin");
  try {
    if (input.evidenceRequired && !input.signing) throw new Error("Required settings trust evidence cannot be created");
    const trustEvidence = input.signing ? await buildEvidence(input) : null;
    const result = await persistSettingsPublishResult({ publishResult: input.publishResult, repository: createSettingsPersistenceRepository(input.executor) });
    if (trustEvidence) await persistEvidence(input.executor, trustEvidence);
    else if (input.evidenceRequired) throw new Error("Required settings trust evidence is missing");
    await input.executor.query("commit");
    return { ...result, trustEvidence };
  } catch (error) { await input.executor.query("rollback"); throw error; }
}
