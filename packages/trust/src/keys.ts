import { Buffer } from "node:buffer";
import { createPublicKey, verify as nodeVerify } from "node:crypto";
import { canonicalize, canonicalUtcTimestamp } from "./canonicalization";
import { ALGORITHM_POLICY_VERSION, enforceAlgorithmPolicy, type AlgorithmContext } from "./policy";
import type { ProviderKeyHandle, SignatureProvider } from "./providers";
import type { KeyPurpose, SignatureRecord, TrustKey, TrustKeyStatus, VerificationReasonCode } from "./types";
import { validateTrustKey } from "./validation";

export type TrustKeyResolver = { readonly resolve: (input: { readonly tenantId: string; readonly keyId: string; readonly keyVersion: number }) => Promise<TrustKey | null> };
export type PublicKeyRegistrationProvider = { readonly register: (input: { readonly tenantId: string; readonly identityId: string; readonly algorithm: TrustKey["algorithm"]; readonly purpose: KeyPurpose; readonly scopeId: string; readonly providerKeyReference: string }) => Promise<{ readonly publicKey: string; readonly publicKeyEncoding: "spki-der-base64url" }> };

export type TrustKeyTransaction = {
  readonly get: (tenantId: string, keyId: string, keyVersion: number) => Promise<TrustKey | null>;
  readonly getActive: (tenantId: string, purpose: KeyPurpose, scopeId: string) => Promise<TrustKey | null>;
  readonly insert: (key: TrustKey) => Promise<void>;
  readonly update: (key: TrustKey, expectedStatus: TrustKeyStatus) => Promise<void>;
};
export type TrustKeyLifecycleRepository = { readonly transaction: <T>(operation: (transaction: TrustKeyTransaction) => Promise<T>) => Promise<T> };

export class KeyUseError extends Error {
  constructor(readonly reasonCode: VerificationReasonCode, message: string) { super(message); this.name = "KeyUseError"; }
}

function at(value: string): number {
  const result = Date.parse(value);
  if (Number.isNaN(result)) throw new KeyUseError("malformed_envelope", `Invalid timestamp: ${value}`);
  return result;
}

export function keyPurposeForDomain(domain: string, signerType: string): KeyPurpose {
  if (domain === "settings.snapshot" || domain === "brand.tokens.snapshot") return "settings_signing";
  if (domain === "provenance.manifest") return "provenance_signing";
  if (domain.startsWith("capital.")) return "capital_document_signing";
  if (domain.endsWith(".audit") || domain === "telephony.usage" || domain === "sentinelq.evidence") return "audit_chain_signing";
  return signerType === "platform" || signerType === "system" ? "platform_artifact_signing" : "tenant_artifact_signing";
}

export function signatureContextForPurpose(purpose: KeyPurpose): AlgorithmContext {
  if (purpose === "audit_chain_signing") return "audit-signature";
  if (purpose === "provenance_signing") return "provenance-signature";
  if (purpose === "agent_message_signing") return "agent-message-signature";
  if (purpose === "capital_document_signing") return "capital-document-signature";
  return purpose === "platform_artifact_signing" ? "platform-signature" : "tenant-signature";
}

export function transitionTrustKey(key: TrustKey, nextStatus: TrustKeyStatus, occurredAt: string): TrustKey {
  const transitions: Readonly<Record<TrustKeyStatus, readonly TrustKeyStatus[]>> = {
    pending: ["active", "revoked", "compromised"], active: ["retiring", "revoked", "compromised"],
    retiring: ["retired", "revoked", "compromised"], retired: ["revoked", "compromised"],
    revoked: ["compromised"], compromised: []
  };
  if (!transitions[key.status].includes(nextStatus)) throw new Error(`Invalid key transition ${key.status} -> ${nextStatus}`);
  const timestamp = canonicalUtcTimestamp(occurredAt);
  return Object.freeze({
    ...key,
    compromisedAt: nextStatus === "compromised" ? timestamp : key.compromisedAt,
    revokedAt: nextStatus === "revoked" ? timestamp : key.revokedAt,
    status: nextStatus,
    statusChangedAt: timestamp,
    validUntil: nextStatus === "retiring" ? timestamp : key.validUntil
  });
}

export const activateTrustKey = (key: TrustKey, occurredAt: string): TrustKey => transitionTrustKey(key, "active", occurredAt);
export const beginKeyRetirement = (key: TrustKey, occurredAt: string): TrustKey => transitionTrustKey(key, "retiring", occurredAt);
export const completeKeyRetirement = (key: TrustKey, occurredAt: string): TrustKey => transitionTrustKey(key, "retired", occurredAt);
export const revokeTrustKey = (key: TrustKey, occurredAt: string): TrustKey => transitionTrustKey(key, "revoked", occurredAt);
export const compromiseTrustKey = (key: TrustKey, occurredAt: string): TrustKey => transitionTrustKey(key, "compromised", occurredAt);

export async function registerPendingTrustKey(input: {
  readonly provider: PublicKeyRegistrationProvider;
  readonly keyId: string; readonly keyVersion: number; readonly tenantId: string; readonly identityId: string;
  readonly algorithm: TrustKey["algorithm"]; readonly purpose: KeyPurpose; readonly scopeId: string;
  readonly providerType: TrustKey["providerType"]; readonly providerKeyReference: string;
  readonly validFrom: string; readonly validUntil: string | null; readonly replacesKeyId: string | null;
  readonly replacesKeyVersion: number | null; readonly createdAt: string;
}): Promise<TrustKey> {
  if ((input.replacesKeyId === null) !== (input.replacesKeyVersion === null)) throw new Error("Replacement identity/version must be complete");
  const registered = await input.provider.register({
    algorithm: input.algorithm,
    identityId: input.identityId,
    providerKeyReference: input.providerKeyReference,
    purpose: input.purpose,
    scopeId: input.scopeId,
    tenantId: input.tenantId
  });
  const createdAt = canonicalUtcTimestamp(input.createdAt);
  return Object.freeze({
    algorithm: input.algorithm, compromisedAt: null, createdAt, identityId: input.identityId,
    keyId: input.keyId, keyVersion: input.keyVersion, metadata: {}, providerKeyReference: input.providerKeyReference,
    providerType: input.providerType, publicKey: registered.publicKey, publicKeyEncoding: registered.publicKeyEncoding,
    purpose: input.purpose, replacesKeyId: input.replacesKeyId, replacesKeyVersion: input.replacesKeyVersion,
    revokedAt: null, scopeId: input.scopeId, status: "pending", statusChangedAt: createdAt,
    structureVersion: "1", tenantId: input.tenantId, validFrom: canonicalUtcTimestamp(input.validFrom),
    validUntil: input.validUntil === null ? null : canonicalUtcTimestamp(input.validUntil)
  });
}

export type CompromiseResponse = {
  readonly key: TrustKey;
  readonly signingDisabled: true;
  readonly historicalVerificationDenied: true;
  readonly requireEnvelopeReverification: true;
  readonly auditEventType: "trust.key.compromised";
};

export function createCompromiseResponse(key: TrustKey, occurredAt: string): CompromiseResponse {
  return Object.freeze({ auditEventType: "trust.key.compromised", historicalVerificationDenied: true, key: compromiseTrustKey(key, occurredAt), requireEnvelopeReverification: true, signingDisabled: true });
}

export async function rotateTrustKeyTransactional(input: { readonly repository: TrustKeyLifecycleRepository; readonly replacement: TrustKey; readonly occurredAt: string }): Promise<TrustKey> {
  return input.repository.transaction(async (transaction) => {
    if (input.replacement.status !== "pending" || input.replacement.replacesKeyId === null || input.replacement.replacesKeyVersion === null) throw new Error("Replacement must be pending and identify the prior key/version");
    const active = await transaction.getActive(input.replacement.tenantId, input.replacement.purpose, input.replacement.scopeId);
    if (!active || active.keyId !== input.replacement.replacesKeyId || active.keyVersion !== input.replacement.replacesKeyVersion) throw new Error("Active replacement predecessor mismatch");
    if (input.replacement.keyVersion !== active.keyVersion + 1 || input.replacement.identityId !== active.identityId) throw new Error("Replacement version or identity mismatch");
    const retiring = transitionTrustKey(active, "retiring", input.occurredAt);
    await transaction.update(retiring, "active");
    await transaction.insert(input.replacement);
    const activated = activateTrustKey(input.replacement, input.occurredAt);
    await transaction.update(activated, "pending");
    return activated;
  });
}

export function enforceKeyForSigning(key: TrustKey, tenantId: string, purpose: KeyPurpose, signedAt: string): void {
  if (!validateTrustKey(key).valid) throw new KeyUseError("unknown_key", "Invalid key record");
  if (key.tenantId !== tenantId) throw new KeyUseError("tenant_mismatch", "Key tenant mismatch");
  if (key.purpose !== purpose || key.purpose === "verification_only") throw new KeyUseError("wrong_key_purpose", "Wrong key purpose");
  if (key.status === "revoked") throw new KeyUseError("key_revoked", "Revoked key cannot sign");
  if (key.status === "compromised") throw new KeyUseError("key_compromised", "Compromised key cannot sign");
  if (key.status !== "active") throw new KeyUseError("wrong_key_purpose", "Only active keys can sign");
  const instant = at(signedAt);
  if (instant < at(key.validFrom)) throw new KeyUseError("key_not_yet_valid", "Key not yet valid");
  if (key.validUntil !== null && instant > at(key.validUntil)) throw new KeyUseError("key_expired", "Key expired");
}

export function enforceKeyForVerification(key: TrustKey, input: { readonly tenantId: string; readonly keyVersion: number; readonly purpose: KeyPurpose; readonly signedAt: string; readonly allowRetiredHistorical: boolean }): void {
  if (key.tenantId !== input.tenantId) throw new KeyUseError("tenant_mismatch", "Key tenant mismatch");
  if (key.keyVersion !== input.keyVersion) throw new KeyUseError("wrong_key_version", "Wrong key version");
  if (key.purpose !== input.purpose && key.purpose !== "verification_only") throw new KeyUseError("wrong_key_purpose", "Wrong key purpose");
  if (key.status === "revoked") throw new KeyUseError("key_revoked", "Key revoked");
  if (key.status === "compromised") throw new KeyUseError("key_compromised", "Key compromised");
  if (key.status === "pending") throw new KeyUseError("key_not_yet_valid", "Pending keys cannot verify signatures");
  if (key.status === "retired" && !input.allowRetiredHistorical) throw new KeyUseError("key_retired_policy_denied", "Retired-key verification requires explicit policy");
  const instant = at(input.signedAt);
  if (instant < at(key.validFrom)) throw new KeyUseError("key_not_yet_valid", "Signature predates key validity");
  const cutoff = key.validUntil ?? (key.status === "retiring" || key.status === "retired" ? key.statusChangedAt : null);
  if (cutoff !== null && instant > at(cutoff)) throw new KeyUseError("key_expired", "Signature follows key signing validity");
}

export async function signBytes(input: { readonly data: Uint8Array; readonly key: TrustKey; readonly provider: SignatureProvider; readonly purpose: KeyPurpose; readonly signedAt: string; readonly tenantId: string }): Promise<SignatureRecord> {
  enforceKeyForSigning(input.key, input.tenantId, input.purpose, input.signedAt);
  enforceAlgorithmPolicy({ algorithm: input.key.algorithm, context: signatureContextForPurpose(input.purpose), operation: "signature", policyVersion: ALGORITHM_POLICY_VERSION });
  const handle: ProviderKeyHandle = { keyId: input.key.keyId, keyVersion: input.key.keyVersion, providerKeyReference: input.key.providerKeyReference, providerType: input.key.providerType };
  const signature = await input.provider.sign({ algorithm: input.key.algorithm, data: input.data, key: handle });
  return { algorithm: input.key.algorithm, keyId: input.key.keyId, keyVersion: input.key.keyVersion, purpose: input.purpose, signedAt: canonicalUtcTimestamp(input.signedAt), value: Buffer.from(signature).toString("base64url") };
}

export function verifySignatureBytes(input: { readonly data: Uint8Array; readonly key: TrustKey; readonly signature: string }): boolean {
  try {
    if (input.key.algorithm !== "Ed25519" || !/^[A-Za-z0-9_-]+$/.test(input.signature)) return false;
    const key = createPublicKey({ format: "der", key: Buffer.from(input.key.publicKey, "base64url"), type: "spki" });
    return nodeVerify(null, input.data, key, Buffer.from(input.signature, "base64url"));
  } catch { return false; }
}

export function signingBytes(value: unknown): Uint8Array { return canonicalize(value, { schemaVersion: "trust-signature-preimage-1" }).bytes; }
