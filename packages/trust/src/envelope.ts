import { canonicalize, canonicalUtcTimestamp, CANONICALIZATION_VERSION, type CanonicalValue } from "./canonicalization";
import { createDomainDigest, isSecurityDomain, type SecurityDomain } from "./domains";
import { internalDigest } from "./hashing";
import {
  enforceKeyForVerification,
  keyPurposeForDomain,
  KeyUseError,
  signBytes,
  signingBytes,
  verifySignatureBytes,
  type TrustKeyResolver
} from "./keys";
import {
  ALGORITHM_POLICY_VERSION,
  AlgorithmPolicyError,
  DEFAULT_DIGEST_ALGORITHM,
  enforceAlgorithmPolicy
} from "./policy";
import type { SignatureProvider } from "./providers";
import { verifyProvenanceManifest } from "./provenance";
import type {
  CryptographicEnvelope,
  EnvelopeStatus,
  ProvenanceManifest,
  SafeMetadata,
  SignerType,
  TrustKey,
  VerificationComponents,
  VerificationReasonCode,
  VerificationResult
} from "./types";
import { assertSafeMetadata, validateCryptographicEnvelope } from "./validation";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function withoutSignature(envelope: CryptographicEnvelope): Record<string, unknown> {
  const { signature: _signature, ...material } = envelope;
  return material;
}

function envelopeIdentityMaterial(envelope: CryptographicEnvelope): Record<string, unknown> {
  const { envelopeId: _envelopeId, ...material } = withoutSignature(envelope);
  return material;
}

export function computeEnvelopeId(envelope: CryptographicEnvelope): string {
  return `env_${internalDigest("cryptographic-envelope-id/v1", "cryptographic-envelope-id-1", envelopeIdentityMaterial(envelope))}`;
}

function signaturePreimage(envelope: CryptographicEnvelope): Uint8Array {
  return signingBytes(withoutSignature(envelope));
}

export type BuildEnvelopeInput<T extends CanonicalValue> = {
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly artifactType: string;
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly domain: SecurityDomain;
  readonly schemaVersion: string;
  readonly payload: T;
  readonly key: TrustKey;
  readonly provider: SignatureProvider;
  readonly signerType: SignerType;
  readonly signerId: string;
  readonly signedAt: string;
  readonly expiresAt: string | null;
  readonly previousEnvelopeId: string | null;
  readonly previousDigest: string | null;
  readonly provenanceManifestId: string | null;
  readonly metadata: SafeMetadata;
  readonly status: EnvelopeStatus;
  readonly maxCanonicalBytes?: number;
};

export async function buildCryptographicEnvelope<T extends CanonicalValue>(input: BuildEnvelopeInput<T>): Promise<CryptographicEnvelope<T>> {
  if (!isSecurityDomain(input.domain)) throw new Error(`Unregistered security domain: ${input.domain}`);
  if ((input.previousEnvelopeId === null) !== (input.previousDigest === null)) throw new Error("Correction linkage requires both previousEnvelopeId and previousDigest");
  assertSafeMetadata(input.metadata);
  if (input.key.identityId !== input.signerId) throw new Error("Signer identity must match the signing key identity");
  const signedAt = canonicalUtcTimestamp(input.signedAt);
  const expiresAt = input.expiresAt === null ? null : canonicalUtcTimestamp(input.expiresAt);
  if (expiresAt !== null && Date.parse(expiresAt) <= Date.parse(signedAt)) throw new Error("expiresAt must follow signedAt");
  const normalized = canonicalize(input.payload, input.maxCanonicalBytes === undefined
    ? { schemaVersion: input.schemaVersion }
    : { maxBytes: input.maxCanonicalBytes, schemaVersion: input.schemaVersion });
  const payload = JSON.parse(normalized.json) as T;
  const digest = createDomainDigest({
    artifactId: input.artifactId,
    artifactType: input.artifactType,
    artifactVersion: input.artifactVersion,
    canonicalizationVersion: CANONICALIZATION_VERSION,
    cardId: input.cardId,
    domain: input.domain,
    payload,
    schemaVersion: input.schemaVersion,
    tenantId: input.tenantId
  });
  const purpose = keyPurposeForDomain(input.domain, input.signerType);
  const unsigned: CryptographicEnvelope<T> = {
    algorithmPolicyVersion: ALGORITHM_POLICY_VERSION,
    artifactId: input.artifactId,
    artifactType: input.artifactType,
    artifactVersion: input.artifactVersion,
    canonicalizationVersion: CANONICALIZATION_VERSION,
    cardId: input.cardId,
    digest,
    digestAlgorithm: DEFAULT_DIGEST_ALGORITHM,
    domain: input.domain,
    envelopeId: "",
    envelopeVersion: "1",
    expiresAt,
    keyId: input.key.keyId,
    keyPurpose: purpose,
    keyVersion: input.key.keyVersion,
    metadata: input.metadata,
    payload,
    previousDigest: input.previousDigest,
    previousEnvelopeId: input.previousEnvelopeId,
    provenanceManifestId: input.provenanceManifestId,
    schemaVersion: input.schemaVersion,
    signature: "",
    signatureAlgorithm: input.key.algorithm,
    signedAt,
    signerId: input.signerId,
    signerType: input.signerType,
    status: input.status,
    structureVersion: "1",
    tenantId: input.tenantId
  };
  const identified = { ...unsigned, envelopeId: computeEnvelopeId(unsigned) };
  const signature = await signBytes({ data: signaturePreimage(identified), key: input.key, provider: input.provider, purpose, signedAt, tenantId: input.tenantId });
  return deepFreeze({ ...identified, signature: signature.value }) as CryptographicEnvelope<T>;
}

export type EnvelopeVerificationExpectations = {
  readonly tenantId?: string;
  readonly cardId?: string | null;
  readonly artifactType?: string;
  readonly artifactId?: string;
  readonly artifactVersion?: string;
  readonly requirePreviousEnvelope?: boolean;
  readonly requireProvenanceManifest?: boolean;
};

export type PriorEnvelopeResolver = { readonly resolvePriorEnvelope: (input: { readonly tenantId: string; readonly envelopeId: string }) => Promise<CryptographicEnvelope | null> };
export type ProvenanceManifestResolver = { readonly resolveProvenanceManifest: (input: { readonly tenantId: string; readonly manifestId: string }) => Promise<ProvenanceManifest | null> };

type MutableComponents = { -readonly [Key in keyof VerificationComponents]: VerificationComponents[Key] };
const blankComponents = (): MutableComponents => ({
  algorithmValid: false, constraintsValid: false, digestValid: false, evidenceValid: false,
  keyValid: false, linkageValid: false, provenanceValid: false, signatureValid: false, structureValid: false
});

function finish(input: {
  readonly components: VerificationComponents;
  readonly envelope: Partial<CryptographicEnvelope> | null;
  readonly reasons: readonly VerificationReasonCode[];
  readonly warnings: readonly string[];
  readonly verifiedAt: string;
}): VerificationResult {
  const reasons = [...new Set(input.reasons)];
  const valid = reasons.length === 0;
  return {
    components: input.components,
    envelopeId: typeof input.envelope?.envelopeId === "string" ? input.envelope.envelopeId : null,
    keyId: typeof input.envelope?.keyId === "string" ? input.envelope.keyId : null,
    keyVersion: typeof input.envelope?.keyVersion === "number" ? input.envelope.keyVersion : null,
    reasonCodes: valid ? ["verified"] : reasons,
    structureVersion: "1",
    valid,
    verifiedAt: input.verifiedAt,
    warnings: input.warnings
  };
}

function policyReason(error: AlgorithmPolicyError): VerificationReasonCode {
  if (error.code === "unknown-algorithm") return "unknown_algorithm";
  if (error.code === "algorithm-disabled" || error.code === "algorithm-type-hook-only") return "disabled_algorithm";
  return "algorithm_context_invalid";
}

function partialEnvelope(value: unknown): Partial<CryptographicEnvelope> | null {
  return value !== null && typeof value === "object" ? value as Partial<CryptographicEnvelope> : null;
}

export async function verifyCryptographicEnvelope(input: {
  readonly envelope: unknown;
  readonly keyResolver: TrustKeyResolver;
  readonly priorEnvelopeResolver?: PriorEnvelopeResolver;
  readonly provenanceResolver?: ProvenanceManifestResolver;
  readonly expected?: EnvelopeVerificationExpectations;
  readonly allowRetiredHistorical: boolean;
  readonly verifiedAt: string;
}): Promise<VerificationResult> {
  const components = blankComponents();
  const reasons: VerificationReasonCode[] = [];
  const warnings: string[] = [];
  const partial = partialEnvelope(input.envelope);
  let verifiedAt: string;
  try { verifiedAt = canonicalUtcTimestamp(input.verifiedAt); } catch { verifiedAt = new Date(0).toISOString(); }
  try {
    if (!partial) return finish({ components, envelope: null, reasons: ["malformed_envelope"], verifiedAt, warnings });
    if (partial.envelopeVersion !== "1") reasons.push("unsupported_envelope_version");
    if (partial.canonicalizationVersion !== CANONICALIZATION_VERSION) reasons.push("unsupported_canonicalization_version");
    const validation = validateCryptographicEnvelope(input.envelope);
    if (!validation.valid) {
      if (reasons.length === 0) reasons.push("malformed_envelope");
      return finish({ components, envelope: partial, reasons, verifiedAt, warnings });
    }
    const envelope = input.envelope as CryptographicEnvelope;
    components.structureValid = true;

    try {
      enforceAlgorithmPolicy({ algorithm: envelope.digestAlgorithm, context: "artifact-digest", operation: "digest", policyVersion: envelope.algorithmPolicyVersion });
      enforceAlgorithmPolicy({ algorithm: envelope.signatureAlgorithm, context: keyPurposeForDomain(envelope.domain, envelope.signerType) === "platform_artifact_signing" ? "platform-signature" : envelope.keyPurpose === "audit_chain_signing" ? "audit-signature" : envelope.keyPurpose === "provenance_signing" ? "provenance-signature" : envelope.keyPurpose === "capital_document_signing" ? "capital-document-signature" : "tenant-signature", operation: "signature", policyVersion: envelope.algorithmPolicyVersion });
      components.algorithmValid = true;
    } catch (error) {
      reasons.push(error instanceof AlgorithmPolicyError ? policyReason(error) : "algorithm_context_invalid");
    }

    const expectedPurpose = keyPurposeForDomain(envelope.domain, envelope.signerType);
    if (envelope.keyPurpose !== expectedPurpose) reasons.push("wrong_key_purpose");
    if (input.expected?.tenantId !== undefined && envelope.tenantId !== input.expected.tenantId) reasons.push("tenant_mismatch");
    if (input.expected && "cardId" in input.expected && envelope.cardId !== input.expected.cardId) reasons.push("card_mismatch");
    if (input.expected?.artifactType !== undefined && envelope.artifactType !== input.expected.artifactType) reasons.push("artifact_type_mismatch");
    if (input.expected?.artifactId !== undefined && envelope.artifactId !== input.expected.artifactId) reasons.push("artifact_id_mismatch");
    if (input.expected?.artifactVersion !== undefined && envelope.artifactVersion !== input.expected.artifactVersion) reasons.push("artifact_version_mismatch");
    if (envelope.expiresAt !== null && Date.parse(verifiedAt) >= Date.parse(envelope.expiresAt)) reasons.push("envelope_expired");
    components.constraintsValid = !reasons.some((reason) => ["tenant_mismatch", "card_mismatch", "artifact_type_mismatch", "artifact_id_mismatch", "artifact_version_mismatch", "envelope_expired", "wrong_key_purpose"].includes(reason));

    try {
      const digest = createDomainDigest(envelope);
      if (digest !== envelope.digest) reasons.push("digest_mismatch"); else components.digestValid = true;
      if (computeEnvelopeId(envelope) !== envelope.envelopeId) reasons.push("signed_metadata_mismatch");
    } catch { reasons.push("digest_mismatch"); }

    if (!/^[A-Za-z0-9_-]+$/.test(envelope.signature)) reasons.push("malformed_signature");
    let key: TrustKey | null = null;
    try { key = await input.keyResolver.resolve({ keyId: envelope.keyId, keyVersion: envelope.keyVersion, tenantId: envelope.tenantId }); } catch { key = null; }
    if (!key) reasons.push("unknown_key");
    if (key) {
      if (key.identityId !== envelope.signerId || key.algorithm !== envelope.signatureAlgorithm) reasons.push("signed_metadata_mismatch");
      try {
        enforceKeyForVerification(key, { allowRetiredHistorical: input.allowRetiredHistorical, keyVersion: envelope.keyVersion, purpose: envelope.keyPurpose, signedAt: envelope.signedAt, tenantId: envelope.tenantId });
        components.keyValid = true;
        if (key.status === "retired") warnings.push("historical verification used an explicitly allowed retired key");
      } catch (error) { reasons.push(error instanceof KeyUseError ? error.reasonCode : "unknown_key"); }
      if (components.keyValid && key.identityId === envelope.signerId && key.algorithm === envelope.signatureAlgorithm && !reasons.includes("malformed_signature")) {
        if (verifySignatureBytes({ data: signaturePreimage(envelope), key, signature: envelope.signature })) components.signatureValid = true;
        else reasons.push("signature_invalid");
      }
    }

    const requiresPrevious = input.expected?.requirePreviousEnvelope === true;
    if (envelope.previousEnvelopeId === null) {
      components.linkageValid = !requiresPrevious;
      if (requiresPrevious) reasons.push("missing_required_evidence");
    } else if (!input.priorEnvelopeResolver) reasons.push("missing_required_evidence");
    else {
      let prior: CryptographicEnvelope | null = null;
      try { prior = await input.priorEnvelopeResolver.resolvePriorEnvelope({ envelopeId: envelope.previousEnvelopeId, tenantId: envelope.tenantId }); } catch { prior = null; }
      if (!prior || prior.envelopeId !== envelope.previousEnvelopeId || prior.digest !== envelope.previousDigest || prior.tenantId !== envelope.tenantId || prior.artifactType !== envelope.artifactType || prior.artifactId !== envelope.artifactId) reasons.push("broken_prior_linkage");
      else components.linkageValid = true;
    }

    const requiresProvenance = input.expected?.requireProvenanceManifest === true;
    if (envelope.provenanceManifestId === null) {
      components.provenanceValid = !requiresProvenance;
      if (requiresProvenance) reasons.push("missing_required_evidence");
    } else if (!input.provenanceResolver) reasons.push("missing_required_evidence");
    else {
      let manifest: ProvenanceManifest | null = null;
      try { manifest = await input.provenanceResolver.resolveProvenanceManifest({ manifestId: envelope.provenanceManifestId, tenantId: envelope.tenantId }); } catch { manifest = null; }
      if (!manifest || !verifyProvenanceManifest(manifest) || manifest.tenantId !== envelope.tenantId || manifest.artifactType !== envelope.artifactType || manifest.artifactId !== envelope.artifactId || manifest.artifactVersion !== envelope.artifactVersion || manifest.artifactDigest !== envelope.digest) reasons.push("invalid_provenance_linkage");
      else components.provenanceValid = true;
    }
    components.evidenceValid = components.linkageValid && components.provenanceValid;
    return finish({ components, envelope, reasons, verifiedAt, warnings });
  } catch {
    if (reasons.length === 0) reasons.push("malformed_envelope");
    return finish({ components, envelope: partial, reasons, verifiedAt, warnings });
  }
}
