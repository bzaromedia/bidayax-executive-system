import { NextResponse } from "next/server";
import { authorizeTrustOperation, isTrustOperation, verifyAuditChain, verifyCryptographicEnvelope, verifyMerkleProof, type CryptographicEnvelope, type MerkleProof, type ProvenanceManifest, type TrustKey } from "@bidayax/trust";
import { identityCsrfCookieName, parseCookie, verifyCsrf } from "@bidayax/identity";
import { getIdentityPool, resolveRequestApplicationSession } from "./identity-runtime";

function error(code: string, message: string, status: number) { return NextResponse.json({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } }); }
function scope(request: Request) { const url = new URL(request.url); return { tenantId: url.searchParams.get("tenantId") ?? "", cardId: url.searchParams.get("cardId") }; }
function timestamp(value: unknown): string { return value instanceof Date ? value.toISOString() : String(value); }
function envelopeRow(row: Record<string, unknown>): CryptographicEnvelope { return { algorithmPolicyVersion: String(row.algorithm_policy_version), artifactId: String(row.artifact_id), artifactType: String(row.artifact_type), artifactVersion: String(row.artifact_version), canonicalizationVersion: String(row.canonicalization_version), cardId: row.card_id === null ? null : String(row.card_id), digest: String(row.digest), digestAlgorithm: row.digest_algorithm as CryptographicEnvelope["digestAlgorithm"], domain: row.domain as CryptographicEnvelope["domain"], envelopeId: String(row.envelope_id), envelopeVersion: "1", expiresAt: row.expires_at === null ? null : timestamp(row.expires_at), keyId: String(row.key_id), keyPurpose: row.key_purpose as CryptographicEnvelope["keyPurpose"], keyVersion: Number(row.key_version), metadata: row.metadata as CryptographicEnvelope["metadata"], payload: row.payload as CryptographicEnvelope["payload"], previousDigest: row.previous_digest === null ? null : String(row.previous_digest), previousEnvelopeId: row.previous_envelope_id === null ? null : String(row.previous_envelope_id), provenanceManifestId: row.provenance_manifest_id === null ? null : String(row.provenance_manifest_id), schemaVersion: String(row.schema_version), signature: String(row.signature), signatureAlgorithm: row.signature_algorithm as CryptographicEnvelope["signatureAlgorithm"], signedAt: timestamp(row.signed_at), signerId: String(row.signer_id), signerType: row.signer_type as CryptographicEnvelope["signerType"], status: row.status as CryptographicEnvelope["status"], structureVersion: "1", tenantId: String(row.tenant_id) }; }
function manifestRow(row: Record<string, unknown>): ProvenanceManifest { return { artifactDigest: String(row.artifact_digest), artifactId: String(row.artifact_id), artifactType: String(row.artifact_type), artifactVersion: String(row.artifact_version), createdAt: timestamp(row.created_at), events: row.lifecycle_events as ProvenanceManifest["events"], links: row.links as ProvenanceManifest["links"], manifestDigest: String(row.manifest_digest), manifestId: String(row.manifest_id), metadata: row.metadata as ProvenanceManifest["metadata"], schemaVersion: String(row.schema_version), structureVersion: "1", tenantId: String(row.tenant_id) }; }

export async function handleTrustRequest(request: Request, operationValue: string) {
  if (!isTrustOperation(operationValue)) return error("not_found", "Unknown trust operation.", 404);
  const resource = scope(request);
  if (!resource.tenantId) return error("invalid_scope", "tenantId is required.", 400);
  const identity = await resolveRequestApplicationSession(request);
  if (!identity.ok) return error(identity.status === 401 ? "unauthenticated" : "authorization_denied", identity.reason, identity.status);
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (!origin || !identity.environment.allowedRedirectOrigins.includes(origin)) return error("csrf_failed", "Trust request origin validation failed.", 403);
    const csrfValid = await verifyCsrf({ csrfCookie: parseCookie(request.headers.get("cookie"), identityCsrfCookieName), csrfHeader: request.headers.get("x-csrf-token"), repository: identity.repository, sessionId: identity.session.sessionId });
    if (!csrfValid) return error("csrf_failed", "Trust request CSRF validation failed.", 403);
  }
  const decision = authorizeTrustOperation({ authenticatedTenantId: identity.context.tenantId, cardId: resource.cardId, operation: operationValue, permissions: identity.context.permissions, permittedCardIds: identity.context.permittedCardIds, privileged: identity.context.role === "tenant_owner" || identity.context.role === "tenant_admin", resourceTenantId: resource.tenantId });
  if (!decision.allowed) return error(decision.code, "Trust operation is not authorized.", decision.code === "unknown_operation" ? 404 : 403);
  if (request.method === "POST" && operationValue === "revocations" && !identity.context.permissions.includes("trust.keys.manage")) return error("permission_denied", "trust.keys.manage is required.", 403);
  const database = getIdentityPool();
  if (!database) return error("trust_unavailable", "Trust persistence is unavailable.", 503);

  if (request.method === "POST" && operationValue === "merkle") {
    const body = await request.json().catch(() => null) as { proof?: MerkleProof } | null;
    if (!body?.proof) return error("invalid_request", "A Merkle proof is required.", 400);
    return NextResponse.json(verifyMerkleProof(body.proof, { tenantId: resource.tenantId }), { headers: { "cache-control": "no-store" } });
  }
  if (request.method === "POST" && operationValue === "audit-chains") {
    const body = await request.json().catch(() => null) as { entries?: Parameters<typeof verifyAuditChain>[0]; streamId?: string } | null;
    if (!body?.entries || !body.streamId) return error("invalid_request", "Audit entries and streamId are required.", 400);
    return NextResponse.json(verifyAuditChain(body.entries, { expectedStreamId: body.streamId, expectedTenantId: resource.tenantId }), { headers: { "cache-control": "no-store" } });
  }
  if (request.method === "POST" && operationValue === "artifact-verification") {
    const body = await request.json().catch(() => null) as { envelope?: unknown; expected?: { tenantId?: string; cardId?: string | null; artifactType?: string; artifactId?: string; artifactVersion?: string; requirePreviousEnvelope?: boolean; requireProvenanceManifest?: boolean } } | null;
    if (!body?.envelope) return error("invalid_request", "A cryptographic envelope is required.", 400);
    const expected = { ...body.expected, tenantId: resource.tenantId, ...(resource.cardId === null ? {} : { cardId: resource.cardId }) };
    const result = await verifyCryptographicEnvelope({ allowRetiredHistorical: false, envelope: body.envelope, expected, verifiedAt: new Date().toISOString(), keyResolver: { async resolve(input) {
      const keyResult = await database.query("select * from trust_keys where tenant_id=$1 and key_id=$2 and key_version=$3", [input.tenantId, input.keyId, input.keyVersion]); const row = keyResult.rows[0] as Record<string, unknown> | undefined; if (!row) return null;
      return { algorithm: row.algorithm, compromisedAt: row.compromised_at === null ? null : timestamp(row.compromised_at), createdAt: timestamp(row.created_at), identityId: row.identity_id, keyId: row.key_id, keyVersion: row.key_version, metadata: row.metadata, providerKeyReference: row.provider_key_reference, providerType: row.provider_type, publicKey: row.public_key, publicKeyEncoding: row.public_key_encoding, purpose: row.purpose, replacesKeyId: row.replaces_key_id, replacesKeyVersion: row.replaces_key_version, revokedAt: row.revoked_at === null ? null : timestamp(row.revoked_at), scopeId: row.scope_id, status: row.status, statusChangedAt: timestamp(row.status_changed_at), structureVersion: row.structure_version, tenantId: row.tenant_id, validFrom: timestamp(row.valid_from), validUntil: row.valid_until === null ? null : timestamp(row.valid_until) } as TrustKey;
    } }, priorEnvelopeResolver: { async resolvePriorEnvelope(input) { const prior = await database.query("select * from cryptographic_envelopes where tenant_id=$1 and envelope_id=$2", [input.tenantId, input.envelopeId]); const row = prior.rows[0] as Record<string, unknown> | undefined; return row ? envelopeRow(row) : null; } }, provenanceResolver: { async resolveProvenanceManifest(input) { const manifest = await database.query("select * from trust_provenance_manifests where tenant_id=$1 and manifest_id=$2", [input.tenantId, input.manifestId]); const row = manifest.rows[0] as Record<string, unknown> | undefined; return row ? manifestRow(row) : null; } } });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  }
  if (request.method === "POST" && operationValue === "revocations") {
    const body = await request.json().catch(() => null) as { keyId?: string; keyVersion?: number; revocationType?: "revoked" | "compromised"; reasonCode?: string; idempotencyKey?: string } | null;
    if (!body?.keyId || !Number.isSafeInteger(body.keyVersion) || !body.revocationType || !body.reasonCode || !body.idempotencyKey) return error("invalid_request", "Complete revocation evidence is required.", 400);
    const client = await database.connect(); const effectiveAt = new Date().toISOString();
    try { await client.query("begin"); const update = await client.query(`update trust_keys set status=$1,status_changed_at=$2,revoked_at=case when $1='revoked' then $2 else revoked_at end,compromised_at=case when $1='compromised' then $2 else compromised_at end where tenant_id=$3 and key_id=$4 and key_version=$5 and status in ('pending','active','retiring','retired','revoked') returning key_id`, [body.revocationType,effectiveAt,resource.tenantId,body.keyId,body.keyVersion]); if (update.rowCount !== 1) throw new Error("Key is unavailable for revocation"); const revocationId = `rev_${body.keyId}_${body.keyVersion}_${body.idempotencyKey}`; await client.query("insert into trust_key_revocations (revocation_id,tenant_id,key_id,key_version,revocation_type,reason_code,effective_at,recorded_at,actor_identity_id,idempotency_key) values ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9)", [revocationId,resource.tenantId,body.keyId,body.keyVersion,body.revocationType,body.reasonCode,effectiveAt,identity.context.userId,body.idempotencyKey]); await client.query("commit"); return NextResponse.json({ revocationId, status: body.revocationType }, { status: 201, headers: { "cache-control": "no-store" } }); } catch { await client.query("rollback"); return error("revocation_failed", "Revocation was not persisted.", 409); } finally { client.release(); }
  }
  if (request.method === "POST" && operationValue === "key-rotation") return error("provider_required", "Rotation requires an injected KMS/HSM lifecycle provider and cannot proceed while no production provider is configured.", 503);

  const filters = resource.cardId === null ? [resource.tenantId] : [resource.tenantId, resource.cardId];
  const cardClause = resource.cardId === null ? "" : " and card_id = $2";
  const keyScopeClause = resource.cardId === null ? "" : " and scope_id in ($1,$2)";
  const auditScopeClause = resource.cardId === null ? "" : " and exists (select 1 from trust_events t where t.tenant_id=trust_audit_chain_entries.tenant_id and t.event_id=trust_audit_chain_entries.event_id and t.details->>'cardId'=$2)";
  const provenanceScopeClause = resource.cardId === null ? "" : " and exists (select 1 from cryptographic_envelopes e where e.tenant_id=trust_provenance_manifests.tenant_id and e.provenance_manifest_id=trust_provenance_manifests.manifest_id and e.card_id=$2)";
  const receiptScopeClause = resource.cardId === null ? "" : " and exists (select 1 from cryptographic_envelopes e where e.tenant_id=trust_verification_receipts.tenant_id and e.envelope_id=trust_verification_receipts.envelope_id and e.card_id=$2)";
  const queries: Record<string, string> = {
    "trust-status": `select
      (select count(*) from cryptographic_envelopes where tenant_id=$1${cardClause} and domain='settings.snapshot')::int as signed_settings,
      (select count(*) from trust_keys where tenant_id=$1${keyScopeClause} and status='active')::int as active_keys,
      (select count(*) from trust_keys where tenant_id=$1${keyScopeClause} and status='revoked')::int as revoked_keys,
      (select count(*) from trust_keys where tenant_id=$1${keyScopeClause} and status='compromised')::int as compromised_keys,
      (select count(*) from trust_verification_receipts where tenant_id=$1${receiptScopeClause} and valid=false)::int as verification_failures,
      exists(select 1 from trust_audit_chain_entries where tenant_id=$1${auditScopeClause}) as audit_available,
      exists(select 1 from trust_provenance_manifests where tenant_id=$1${provenanceScopeClause}) as provenance_available,
      exists(select 1 from trust_keys where tenant_id=$1${keyScopeClause} and status='active' and provider_type in ('kms','hsm')) as production_provider,
      exists(select 1 from trust_keys where tenant_id=$1${keyScopeClause} and status='active' and metadata->>'environment'='test') as test_key,
      (select max(status_changed_at) from trust_keys where tenant_id=$1${keyScopeClause} and replaces_key_id is not null) as latest_rotation_at`,
    "public-keys": `select key_id,key_version,algorithm,public_key,public_key_encoding,purpose,scope_id,provider_type,status,valid_from,valid_until from trust_keys where tenant_id=$1${resource.cardId === null ? "" : " and scope_id in ($1,$2)"} order by purpose,key_version desc`,
    "key-status": `select key_id,key_version,purpose,scope_id,provider_type,status,valid_from,valid_until,status_changed_at from trust_keys where tenant_id=$1${resource.cardId === null ? "" : " and scope_id in ($1,$2)"} order by status_changed_at desc`,
    "key-rotation": `select key_id,key_version,purpose,scope_id,provider_type,status,replaces_key_id,replaces_key_version,status_changed_at from trust_keys where tenant_id=$1${resource.cardId === null ? "" : " and scope_id in ($1,$2)"} and replaces_key_id is not null order by status_changed_at desc`,
    revocations: `select r.revocation_id,r.key_id,r.key_version,r.revocation_type,r.reason_code,r.effective_at,r.recorded_at from trust_key_revocations r join trust_keys k on k.tenant_id=r.tenant_id and k.key_id=r.key_id and k.key_version=r.key_version where r.tenant_id=$1${resource.cardId === null ? "" : " and k.scope_id in ($1,$2)"} order by r.recorded_at desc`,
    provenance: `select p.manifest_id,p.artifact_type,p.artifact_id,p.artifact_version,p.artifact_digest,p.links,p.lifecycle_events,p.manifest_digest,p.schema_version,p.metadata,p.created_at from trust_provenance_manifests p where p.tenant_id=$1${resource.cardId === null ? "" : " and exists (select 1 from cryptographic_envelopes e where e.tenant_id=p.tenant_id and e.provenance_manifest_id=p.manifest_id and e.card_id=$2)"} order by p.created_at desc`,
    "audit-chains": `select a.entry_id,a.stream_id,a.sequence_number,a.previous_digest,a.event_id,a.event_digest,a.entry_digest,a.checkpoint_sequence,a.checkpoint_digest,a.appended_at from trust_audit_chain_entries a where a.tenant_id=$1${resource.cardId === null ? "" : " and exists (select 1 from trust_events t where t.tenant_id=a.tenant_id and t.event_id=a.event_id and t.details->>'cardId'=$2)"} order by a.stream_id,a.sequence_number`,
    merkle: resource.cardId === null
      ? "select batch_id,leaf_count,root_digest,digest_algorithm,duplicate_policy,odd_node_policy,root_key_id,root_key_version,root_signature_algorithm,root_signature,root_signed_at,created_at from trust_merkle_batches where tenant_id=$1 order by created_at desc"
      : `select distinct b.batch_id,b.leaf_count,b.root_digest,b.digest_algorithm,b.duplicate_policy,b.odd_node_policy,b.root_key_id,b.root_key_version,b.root_signature_algorithm,b.root_signature,b.root_signed_at,b.created_at
         from trust_merkle_batches b
        where b.tenant_id=$1
          and (
            exists (select 1 from cryptographic_envelopes e where e.tenant_id=b.tenant_id and e.card_id=$2 and b.leaf_digests ? e.digest)
            or exists (select 1 from trust_audit_chain_entries a join trust_events t on t.tenant_id=a.tenant_id and t.event_id=a.event_id where a.tenant_id=b.tenant_id and t.details->>'cardId'=$2 and b.leaf_digests ? a.entry_digest)
            or exists (select 1 from trust_provenance_manifests p join cryptographic_envelopes e on e.tenant_id=p.tenant_id and e.provenance_manifest_id=p.manifest_id where p.tenant_id=b.tenant_id and e.card_id=$2 and b.leaf_digests ? p.manifest_digest)
          )
        order by b.created_at desc`,
    "artifact-verification": `select envelope_id,artifact_type,artifact_id,artifact_version,domain,digest_algorithm,digest,signature_algorithm,key_id,key_version,status,signed_at,expires_at from cryptographic_envelopes where tenant_id=$1${cardClause} order by signed_at desc`
  };
  const result = await database.query(queries[operationValue] as string, filters);
  return NextResponse.json({ data: result.rows, scope: resource }, { headers: { "cache-control": "no-store" } });
}
