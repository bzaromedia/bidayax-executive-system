import { canonicalize, canonicalUtcTimestamp, CANONICALIZATION_VERSION } from "./canonicalization";
import { isSecurityDomain } from "./domains";
import { isHexDigest } from "./hashing";
import { ALGORITHM_POLICY_VERSION } from "./policy";
import {
  keyPurposes,
  keyStatuses,
  provenanceLifecycleEvents,
  type CryptoIdentity,
  type CryptographicEnvelope,
  type SafeMetadata,
  type TrustKey
} from "./types";

export type RuntimeValidation = { readonly valid: boolean; readonly errors: readonly string[] };
const sensitiveKey = /(private.?key|secret|password|credential|authorization|cookie|token|raw.?key|seed|mnemonic)/i;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function safeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function validateSafeMetadata(value: unknown): RuntimeValidation {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["metadata must be an object"] };
  const visit = (node: unknown, path: string): void => {
    if (record(node)) {
      for (const [key, child] of Object.entries(node)) {
        if (sensitiveKey.test(key)) errors.push(`sensitive metadata key at ${path}.${key}`);
        visit(child, `${path}.${key}`);
      }
    } else if (Array.isArray(node)) node.forEach((child, index) => visit(child, `${path}[${index}]`));
  };
  visit(value, "metadata");
  try { canonicalize(value, { schemaVersion: "safe-metadata-1" }); } catch { errors.push("metadata is not canonicalizable"); }
  return { valid: errors.length === 0, errors };
}

export function assertSafeMetadata(value: unknown): asserts value is SafeMetadata {
  const validation = validateSafeMetadata(value);
  if (!validation.valid) throw new Error(validation.errors.join("; "));
}

function validateVersionedTenantStructure(value: unknown): RuntimeValidation {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["structure must be an object"] };
  if (value.structureVersion !== "1") errors.push("unsupported structureVersion");
  if (!nonEmpty(value.tenantId)) errors.push("tenantId is required");
  try { canonicalize(value, { schemaVersion: "runtime-structure-1" }); } catch { errors.push("structure is not persistence-safe") }
  return { valid: errors.length === 0, errors };
}

export function validateCryptoIdentity(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors];
  if (!nonEmpty(value.identityId) || !nonEmpty(value.displayName)) errors.push("identity fields are required");
  if (!validateSafeMetadata(value.metadata).valid) errors.push("unsafe identity metadata");
  return { valid: errors.length === 0, errors };
}

export function validateTrustKey(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors];
  if (!nonEmpty(value.keyId) || !safeInteger(value.keyVersion)) errors.push("key identity/version is invalid");
  if (!(keyStatuses as readonly unknown[]).includes(value.status)) errors.push("invalid key status");
  if (!(keyPurposes as readonly unknown[]).includes(value.purpose)) errors.push("invalid key purpose");
  if ((value.status === "retiring" || value.status === "retired") && !nonEmpty(value.validUntil)) errors.push("retiring/retired keys require a signing cutoff");
  if (Reflect.ownKeys(value).some((key) => typeof key === "string" && sensitiveKey.test(key))) errors.push("private or sensitive key field is forbidden");
  if (!validateSafeMetadata(value.metadata).valid) errors.push("unsafe key metadata");
  return { valid: errors.length === 0, errors };
}

export function validateCryptographicEnvelope(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors];
  const requiredStrings = ["envelopeId", "artifactType", "artifactId", "artifactVersion", "schemaVersion", "digest", "keyId", "signerId", "signedAt", "signature"];
  for (const field of requiredStrings) if (!nonEmpty(value[field])) errors.push(`${field} is required`);
  if (value.envelopeVersion !== "1") errors.push("unsupported envelopeVersion");
  if (value.canonicalizationVersion !== CANONICALIZATION_VERSION) errors.push("unsupported canonicalizationVersion");
  if (value.algorithmPolicyVersion !== ALGORITHM_POLICY_VERSION) errors.push("unsupported algorithmPolicyVersion");
  if (typeof value.cardId !== "string" && value.cardId !== null) errors.push("cardId must be string or null");
  if (!isSecurityDomain(String(value.domain))) errors.push("unregistered domain");
  if (!safeInteger(value.keyVersion)) errors.push("keyVersion is invalid");
  if ((value.previousEnvelopeId === null) !== (value.previousDigest === null)) errors.push("prior linkage must be complete");
  if (!validateSafeMetadata(value.metadata).valid) errors.push("unsafe envelope metadata");
  return { valid: errors.length === 0, errors };
}

function requiredFields(value: Record<string, unknown>, fields: readonly string[]): string[] {
  return fields.filter((field) => !nonEmpty(value[field])).map((field) => `${field} is required`);
}

export function validateSignedAction(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["actionId", "actorIdentityId", "actionType", "targetId", "idempotencyKey", "schemaVersion"])];
  if (!record(value.signature) || !safeInteger(value.signature.keyVersion)) errors.push("signature record is invalid");
  if (!validateSafeMetadata(value.metadata).valid) errors.push("unsafe action metadata");
  return { valid: errors.length === 0, errors };
}
export function validateTrustEvent(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["eventId", "streamId", "eventType", "subjectType", "subjectId", "occurredAt", "idempotencyKey"])];
  if (value.provenanceLifecycle !== null && !(provenanceLifecycleEvents as readonly unknown[]).includes(value.provenanceLifecycle)) errors.push("invalid provenance lifecycle");
  if (!validateSafeMetadata(value.details).valid) errors.push("unsafe event details");
  return { valid: errors.length === 0, errors };
}
export function validateAgentMessageProof(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["proofId", "messageId", "senderIdentityId", "recipientIdentityId", "messageDigest", "sentAt"])];
  if (!isHexDigest(value.messageDigest)) errors.push("messageDigest is invalid");
  if (!record(value.signature)) errors.push("signature is required");
  return { valid: errors.length === 0, errors };
}
export function validateProvenanceManifest(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["manifestId", "artifactType", "artifactId", "artifactVersion", "artifactDigest", "manifestDigest", "schemaVersion", "createdAt"])];
  if (!isHexDigest(value.artifactDigest) || !isHexDigest(value.manifestDigest)) errors.push("manifest digests are invalid");
  if (!Array.isArray(value.links) || !Array.isArray(value.events)) errors.push("manifest links/events are invalid");
  return { valid: errors.length === 0, errors };
}
export function validateAuditChainEntry(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["entryId", "streamId", "eventDigest", "entryDigest", "appendedAt"])];
  if (!safeInteger(value.sequence) || !isHexDigest(value.eventDigest) || !isHexDigest(value.entryDigest) || !record(value.event)) errors.push("audit entry fields are invalid");
  return { valid: errors.length === 0, errors };
}
export function validateMerkleBatch(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["batchId", "rootDigest", "createdAt"])];
  if (!Array.isArray(value.leafDigests) || value.leafDigests.length === 0 || !safeInteger(value.leafCount) || !isHexDigest(value.rootDigest)) errors.push("Merkle batch fields are invalid");
  return { valid: errors.length === 0, errors };
}
export function validateMerkleProof(value: unknown): RuntimeValidation {
  const base = validateVersionedTenantStructure(value);
  if (!record(value)) return base;
  const errors = [...base.errors, ...requiredFields(value, ["proofId", "batchId", "leafDigest", "rootDigest"])];
  if (!Number.isSafeInteger(value.leafIndex) || (value.leafIndex as number) < 0 || !Array.isArray(value.steps) || !isHexDigest(value.leafDigest) || !isHexDigest(value.rootDigest)) errors.push("Merkle proof fields are invalid");
  return { valid: errors.length === 0, errors };
}

export function validateVerificationResult(value: unknown): RuntimeValidation {
  if (!record(value)) return { valid: false, errors: ["verification result must be an object"] };
  const errors: string[] = [];
  if (value.structureVersion !== "1" || typeof value.valid !== "boolean" || !record(value.components) || !Array.isArray(value.reasonCodes) || !Array.isArray(value.warnings) || !nonEmpty(value.verifiedAt)) errors.push("verification result fields are invalid");
  return { valid: errors.length === 0, errors };
}

export function normalizeUtc(value: string): string { return canonicalUtcTimestamp(value); }

export function toRedactedTrustLog(value: unknown): Readonly<Record<string, unknown>> {
  if (!record(value)) return { structureType: typeof value };
  return Object.freeze({
    artifactId: typeof value.artifactId === "string" ? value.artifactId : undefined,
    envelopeId: typeof value.envelopeId === "string" ? value.envelopeId : undefined,
    eventId: typeof value.eventId === "string" ? value.eventId : undefined,
    keyId: typeof value.keyId === "string" ? value.keyId : undefined,
    structureVersion: value.structureVersion,
    tenantId: value.tenantId
  });
}

export type ValidatedEnvelope = CryptographicEnvelope;
export type ValidatedIdentity = CryptoIdentity;
export type ValidatedTrustKey = TrustKey;
