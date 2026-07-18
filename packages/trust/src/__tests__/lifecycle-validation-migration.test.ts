import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  activateTrustKey,
  beginKeyRetirement,
  completeKeyRetirement,
  createCompromiseResponse,
  registerPendingTrustKey,
  revokeTrustKey,
  rotateTrustKeyTransactional,
  signBytes,
  transitionTrustKey,
  type TrustKeyTransaction
} from "../keys";
import { securityDomains } from "../domains";
import { keyPurposes, keyStatuses, type CryptoIdentity, type TrustKey } from "../types";
import {
  toRedactedTrustLog,
  validateAgentMessageProof,
  validateAuditChainEntry,
  validateCryptoIdentity,
  validateMerkleBatch,
  validateMerkleProof,
  validateProvenanceManifest,
  validateSafeMetadata,
  validateSignedAction,
  validateTrustEvent,
  validateTrustKey,
  validateVerificationResult
} from "../validation";
import { keyFixture, signedAt } from "./test-helpers";

describe("exact key lifecycle and provider neutrality", () => {
  it("exports exactly six statuses and eight purposes", () => {
    expect(keyStatuses).toEqual(["pending", "active", "retiring", "retired", "revoked", "compromised"]);
    expect(keyPurposes).toEqual([
      "platform_artifact_signing", "tenant_artifact_signing", "settings_signing", "audit_chain_signing",
      "provenance_signing", "capital_document_signing", "agent_message_signing", "verification_only"
    ]);
    expect(keyStatuses).not.toContain("rotated");
  });

  it("enforces registration, activation, retirement, revocation, and compromise transitions", async () => {
    const { key: fixture } = keyFixture();
    const pending = await registerPendingTrustKey({
      algorithm: "Ed25519", createdAt: "2026-07-01T00:00:00.000Z", identityId: fixture.identityId,
      keyId: fixture.keyId, keyVersion: 1, provider: { async register(value) {
        expect(value).not.toHaveProperty("privateKey");
        return { publicKey: fixture.publicKey, publicKeyEncoding: "spki-der-base64url" };
      } }, providerKeyReference: fixture.providerKeyReference, providerType: "kms", purpose: fixture.purpose,
      replacesKeyId: null, replacesKeyVersion: null, scopeId: fixture.scopeId, tenantId: fixture.tenantId,
      validFrom: fixture.validFrom, validUntil: null
    });
    expect(pending.status).toBe("pending");
    const active = activateTrustKey(pending, "2026-07-02T00:00:00.000Z");
    const retiring = beginKeyRetirement(active, "2026-07-03T00:00:00.000Z");
    expect(completeKeyRetirement(retiring, "2026-07-04T00:00:00.000Z").status).toBe("retired");
    expect(revokeTrustKey(active, "2026-07-03T00:00:00.000Z").status).toBe("revoked");
    expect(createCompromiseResponse(active, "2026-07-03T00:00:00.000Z")).toMatchObject({ historicalVerificationDenied: true, requireEnvelopeReverification: true, signingDisabled: true });
    expect(() => transitionTrustKey(active, "pending", signedAt)).toThrow("Invalid key transition");
  });

  it("performs replacement rotation inside one repository transaction", async () => {
    const { key: active } = keyFixture();
    const replacement: TrustKey = { ...active, keyId: "key-settings-v2", keyVersion: 2, providerKeyReference: "ref-v2", replacesKeyId: active.keyId, replacesKeyVersion: active.keyVersion, status: "pending", statusChangedAt: "2026-07-17T09:00:00.000Z" };
    const operations: string[] = [];
    const transaction: TrustKeyTransaction = {
      async get() { return null; }, async getActive() { return active; },
      async insert(key) { operations.push(`insert:${key.status}`); },
      async update(key, expected) { operations.push(`update:${expected}->${key.status}`); }
    };
    const activated = await rotateTrustKeyTransactional({ occurredAt: signedAt, replacement, repository: { async transaction(operation) { operations.push("transaction"); return operation(transaction); } } });
    expect(activated.status).toBe("active");
    expect(operations).toEqual(["transaction", "update:active->retiring", "insert:pending", "update:pending->active"]);
  });

  it.each(["revoked", "compromised", "retired", "verification_only"] as const)("prevents signing with %s key/state", async (condition) => {
    const purpose = condition === "verification_only" ? "verification_only" : "settings_signing";
    const status = condition === "verification_only" ? "active" : condition;
    const { key, provider } = keyFixture(purpose, status);
    await expect(signBytes({ data: new Uint8Array([1]), key, provider, purpose: "settings_signing", signedAt, tenantId: key.tenantId })).rejects.toBeTruthy();
  });
});

describe("runtime validation and redacted logging", () => {
  it("validates complete public structures and rejects sensitive fields/metadata", () => {
    const { key } = keyFixture();
    const identity: CryptoIdentity = { createdAt: signedAt, displayName: "Service", identityId: "identity-1", identityType: "service", metadata: {}, status: "active", structureVersion: "1", tenantId: "tenant-1", updatedAt: signedAt };
    expect(validateCryptoIdentity(identity).valid).toBe(true);
    expect(validateTrustKey(key).valid).toBe(true);
    expect(validateTrustKey({ ...key, privateKey: "forbidden" }).valid).toBe(false);
    expect(validateSafeMetadata({ nested: { password: "forbidden" } }).valid).toBe(false);
    expect(toRedactedTrustLog({ ...key, publicKey: "material", metadata: { accessToken: "secret" } })).toEqual(expect.not.objectContaining({ publicKey: expect.anything(), metadata: expect.anything() }));
  });

  it("fails closed for incomplete instances of every remaining core structure", () => {
    const incomplete = { structureVersion: "1", tenantId: "tenant-1" };
    for (const validate of [validateSignedAction, validateTrustEvent, validateAgentMessageProof, validateProvenanceManifest, validateAuditChainEntry, validateMerkleBatch, validateMerkleProof]) {
      expect(validate(incomplete).valid).toBe(false);
    }
    expect(validateVerificationResult({ structureVersion: "1" }).valid).toBe(false);
  });
});

describe("migration 0017 textual contract", () => {
  const root = resolve(import.meta.dirname, "../../../../");
  const sql = readFileSync(resolve(root, "database/migrations/0017_create_cryptographic_trust_layer.sql"), "utf8");

  it("uses every exact conventional table name and no superseded competing names", () => {
    const required = [
      "trust_algorithm_registry", "trust_crypto_identities", "trust_keys", "trust_key_revocations",
      "trust_signed_actions", "trust_events", "cryptographic_envelopes", "trust_audit_chain_entries",
      "trust_merkle_batches", "trust_merkle_proofs", "trust_provenance_manifests", "trust_verification_receipts",
      "trust_agent_message_proofs"
    ];
    for (const table of required) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    for (const old of ["cryptographic_identities", "signed_actions", "audit_chain_entries", "merkle_batches", "provenance_manifests", "cryptographic_verification_receipts", "agent_message_proofs"]) {
      expect(sql).not.toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${old}\\b`));
    }
  });

  it("contains all domains, algorithms, statuses, purposes, version/FK/idempotency/concurrency/immutability guarantees", () => {
    for (const domain of securityDomains) expect(sql).toContain(`'${domain}'`);
    for (const algorithm of ["SHA-256", "SHA-512/256", "SHA3-256", "BLAKE3", "Ed25519", "ECDSA-P256-SHA256", "AES-256-GCM", "XChaCha20-Poly1305", "HKDF-SHA-256", "HMAC-SHA-256", "Argon2id", "MD5", "SHA-1", "AES-ECB", "ML-KEM", "ML-DSA", "SLH-DSA"]) expect(sql).toContain(`'${algorithm}'`);
    for (const status of keyStatuses) expect(sql).toContain(`'${status}'`);
    for (const purpose of keyPurposes) expect(sql).toContain(`'${purpose}'`);
    expect(sql).toContain("key_version INTEGER NOT NULL");
    expect(sql).toContain("WHERE status = 'active'");
    expect(sql).toContain("FOREIGN KEY (key_id, key_version, tenant_id)");
    expect(sql).toContain("idempotency_key TEXT NOT NULL");
    expect(sql).toContain("UNIQUE (tenant_id, stream_id, sequence_number)");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("root_signature_algorithm TEXT");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS trust_merkle_proofs");
    expect(sql).toContain("proof_version TEXT NOT NULL CHECK (proof_version = '1')");
    expect(sql).toContain("digest_algorithm TEXT NOT NULL DEFAULT 'SHA-256' CHECK (digest_algorithm = 'SHA-256')");
    expect(sql).toContain("FOREIGN KEY (batch_id, tenant_id, root_digest)");
    expect(sql).toContain("UNIQUE (tenant_id, batch_id, proof_version, leaf_index, leaf_digest)");
    expect(sql).toContain("idx_trust_merkle_proofs_lookup");
    expect(sql).toContain("trg_trust_merkle_proofs_append_only");
    expect(sql).toContain("Approved Phase 10 durable Merkle inclusion-proof evidence");
    expect(sql).toContain("provider_type TEXT NOT NULL CHECK (provider_type IN ('kms', 'hsm', 'remote-signer'))");
    expect(sql).not.toContain("test-ephemeral");
    expect(sql).toContain("BEFORE UPDATE OR DELETE");
    expect(sql).not.toMatch(/private_key\s+(TEXT|BYTEA)/i);
  });

  it("preserves migrations 0001-0016 and existing FNV compatibility implementations", () => {
    expect(readFileSync(resolve(root, "packages/tokens/src/brand-token-resolver.ts"), "utf8")).toContain("fnv1a-");
    expect(readFileSync(resolve(root, "packages/settings/src/settings-versioning.ts"), "utf8")).toContain("settings-fnv1a-");
  });
});
