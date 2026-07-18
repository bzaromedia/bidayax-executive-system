import type { CanonicalValue } from "./canonicalization";
import type { SecurityDomain } from "./domains";
import type { DigestAlgorithm, SignatureAlgorithm } from "./policy";

export type IsoUtcTimestamp = string;
export type HexDigest = string;
export type Base64Url = string;
export type SafeMetadata = Readonly<Record<string, CanonicalValue>>;

export const keyStatuses = ["pending", "active", "retiring", "retired", "revoked", "compromised"] as const;
export type TrustKeyStatus = (typeof keyStatuses)[number];
export const keyPurposes = [
  "platform_artifact_signing", "tenant_artifact_signing", "settings_signing",
  "audit_chain_signing", "provenance_signing", "capital_document_signing",
  "agent_message_signing", "verification_only"
] as const;
export type KeyPurpose = (typeof keyPurposes)[number];

export type CryptoIdentity = {
  readonly structureVersion: "1";
  readonly identityId: string;
  readonly tenantId: string;
  readonly identityType: "user" | "service" | "agent" | "system";
  readonly displayName: string;
  readonly status: "active" | "disabled";
  readonly metadata: SafeMetadata;
  readonly createdAt: IsoUtcTimestamp;
  readonly updatedAt: IsoUtcTimestamp;
};

/** Public/provider metadata only. There is deliberately no private-key-bearing field. */
export type TrustKey = {
  readonly structureVersion: "1";
  readonly keyId: string;
  readonly keyVersion: number;
  readonly tenantId: string;
  readonly identityId: string;
  readonly algorithm: SignatureAlgorithm;
  readonly publicKey: Base64Url;
  readonly publicKeyEncoding: "spki-der-base64url";
  readonly purpose: KeyPurpose;
  readonly scopeId: string;
  readonly providerType: "kms" | "hsm" | "remote-signer";
  readonly providerKeyReference: string;
  readonly status: TrustKeyStatus;
  readonly validFrom: IsoUtcTimestamp;
  readonly validUntil: IsoUtcTimestamp | null;
  readonly statusChangedAt: IsoUtcTimestamp;
  readonly replacesKeyId: string | null;
  readonly replacesKeyVersion: number | null;
  readonly revokedAt: IsoUtcTimestamp | null;
  readonly compromisedAt: IsoUtcTimestamp | null;
  readonly createdAt: IsoUtcTimestamp;
  readonly metadata: SafeMetadata;
};

export type SignatureRecord = {
  readonly algorithm: SignatureAlgorithm;
  readonly keyId: string;
  readonly keyVersion: number;
  readonly purpose: KeyPurpose;
  readonly signedAt: IsoUtcTimestamp;
  readonly value: Base64Url;
};

export type SignedAction = {
  readonly structureVersion: "1";
  readonly actionId: string;
  readonly tenantId: string;
  readonly actorIdentityId: string;
  readonly actionType: string;
  readonly targetId: string;
  readonly idempotencyKey: string;
  readonly payload: CanonicalValue;
  readonly schemaVersion: string;
  readonly metadata: SafeMetadata;
  readonly signature: SignatureRecord;
};

export const provenanceLifecycleEvents = [
  "created", "edited", "classified", "redacted", "translated", "published",
  "archived", "superseded", "exported", "deleted", "restored"
] as const;
export type ProvenanceLifecycleEvent = (typeof provenanceLifecycleEvents)[number];

export type TrustEvent = {
  readonly structureVersion: "1";
  readonly eventId: string;
  readonly tenantId: string;
  readonly streamId: string;
  readonly eventType: string;
  readonly provenanceLifecycle: ProvenanceLifecycleEvent | null;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly actorIdentityId: string | null;
  readonly occurredAt: IsoUtcTimestamp;
  readonly idempotencyKey: string;
  readonly details: SafeMetadata;
};

export type EnvelopeStatus = "active" | "superseded" | "revoked";
export type SignerType = "platform" | "tenant" | "agent" | "system";

export type CryptographicEnvelope<T extends CanonicalValue = CanonicalValue> = {
  readonly structureVersion: "1";
  readonly envelopeId: string;
  readonly envelopeVersion: "1";
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly artifactType: string;
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly domain: SecurityDomain;
  readonly schemaVersion: string;
  readonly canonicalizationVersion: string;
  readonly digestAlgorithm: DigestAlgorithm;
  readonly digest: HexDigest;
  readonly signatureAlgorithm: SignatureAlgorithm;
  readonly keyId: string;
  readonly keyVersion: number;
  readonly keyPurpose: KeyPurpose;
  readonly signerType: SignerType;
  readonly signerId: string;
  readonly signedAt: IsoUtcTimestamp;
  readonly expiresAt: IsoUtcTimestamp | null;
  readonly previousEnvelopeId: string | null;
  readonly previousDigest: HexDigest | null;
  readonly provenanceManifestId: string | null;
  readonly metadata: SafeMetadata;
  readonly status: EnvelopeStatus;
  readonly payload: T;
  readonly algorithmPolicyVersion: string;
  readonly signature: Base64Url;
};

export const verificationReasonCodes = [
  "verified", "malformed_envelope", "malformed_signature", "unsupported_envelope_version",
  "unsupported_canonicalization_version", "unknown_algorithm", "disabled_algorithm",
  "algorithm_context_invalid", "unknown_key", "wrong_key_version", "wrong_key_purpose",
  "key_not_yet_valid", "key_expired", "key_retired_policy_denied", "key_revoked",
  "key_compromised", "tenant_mismatch", "card_mismatch", "artifact_type_mismatch",
  "artifact_id_mismatch", "artifact_version_mismatch", "digest_mismatch",
  "signed_metadata_mismatch", "signature_invalid", "envelope_expired", "broken_prior_linkage",
  "invalid_provenance_linkage", "missing_required_evidence"
] as const;
export type VerificationReasonCode = (typeof verificationReasonCodes)[number];

export type VerificationComponents = {
  readonly structureValid: boolean;
  readonly algorithmValid: boolean;
  readonly constraintsValid: boolean;
  readonly digestValid: boolean;
  readonly signatureValid: boolean;
  readonly keyValid: boolean;
  readonly linkageValid: boolean;
  readonly provenanceValid: boolean;
  readonly evidenceValid: boolean;
};

export type VerificationResult = {
  readonly structureVersion: "1";
  readonly valid: boolean;
  readonly components: VerificationComponents;
  readonly reasonCodes: readonly VerificationReasonCode[];
  readonly warnings: readonly string[];
  readonly envelopeId: string | null;
  readonly keyId: string | null;
  readonly keyVersion: number | null;
  readonly verifiedAt: IsoUtcTimestamp;
};

export type AgentMessageProof = {
  readonly structureVersion: "1";
  readonly proofId: string;
  readonly tenantId: string;
  readonly messageId: string;
  readonly senderIdentityId: string;
  readonly recipientIdentityId: string;
  readonly messageDigest: HexDigest;
  readonly digestAlgorithm: DigestAlgorithm;
  readonly sentAt: IsoUtcTimestamp;
  readonly metadata: SafeMetadata;
  readonly signature: SignatureRecord;
};

export type ProvenanceLink = {
  readonly artifactType: string;
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly digest: HexDigest;
  readonly relationship: "source" | "derived_from" | "generated_by" | "supersedes";
};

export type ProvenanceEvent = {
  readonly eventId: string;
  readonly lifecycle: ProvenanceLifecycleEvent;
  readonly occurredAt: IsoUtcTimestamp;
  readonly actorIdentityId: string | null;
  readonly priorDigest: HexDigest | null;
  readonly resultingDigest: HexDigest | null;
  readonly safeReference: string | null;
  readonly metadata: SafeMetadata;
};

export type ProvenanceManifest = {
  readonly structureVersion: "1";
  readonly manifestId: string;
  readonly tenantId: string;
  readonly artifactType: string;
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly artifactDigest: HexDigest;
  readonly links: readonly ProvenanceLink[];
  readonly events: readonly ProvenanceEvent[];
  readonly manifestDigest: HexDigest;
  readonly createdAt: IsoUtcTimestamp;
  readonly schemaVersion: string;
  readonly metadata: SafeMetadata;
};

export type AuditCheckpoint = {
  readonly trustedSequence: number;
  readonly trustedDigest: HexDigest;
};

export type AuditChainEntry = {
  readonly structureVersion: "1";
  readonly entryId: string;
  readonly tenantId: string;
  readonly streamId: string;
  readonly sequence: number;
  readonly previousDigest: HexDigest | null;
  readonly event: TrustEvent;
  readonly eventDigest: HexDigest;
  readonly entryDigest: HexDigest;
  readonly checkpoint: AuditCheckpoint | null;
  readonly appendedAt: IsoUtcTimestamp;
};

export type SignedMerkleRoot = {
  readonly structureVersion: "1";
  readonly tenantId: string;
  readonly batchId: string;
  readonly rootDigest: HexDigest;
  readonly leafCount: number;
  readonly signature: SignatureRecord;
};

export type MerkleBatch = {
  readonly structureVersion: "1";
  readonly batchId: string;
  readonly tenantId: string;
  readonly leafDigests: readonly HexDigest[];
  readonly leafCount: number;
  readonly rootDigest: HexDigest;
  readonly digestAlgorithm: DigestAlgorithm;
  readonly duplicatePolicy: "reject";
  readonly oddNodePolicy: "duplicate_last";
  readonly signedRoot: SignedMerkleRoot | null;
  readonly createdAt: IsoUtcTimestamp;
};

export type MerkleProofStep = { readonly siblingDigest: HexDigest; readonly position: "left" | "right" };
export type MerkleProof = {
  readonly structureVersion: "1";
  readonly proofVersion: "1";
  readonly proofId: string;
  readonly batchId: string;
  readonly tenantId: string;
  readonly leafDigest: HexDigest;
  readonly leafIndex: number;
  readonly digestAlgorithm: DigestAlgorithm;
  readonly steps: readonly MerkleProofStep[];
  readonly rootDigest: HexDigest;
};
