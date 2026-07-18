export const ALGORITHM_POLICY_VERSION = "trust-algorithm-policy-1" as const;
export const DEFAULT_DIGEST_ALGORITHM = "SHA-256" as const;
export const PREFERRED_SIGNATURE_ALGORITHM = "Ed25519" as const;

export type DigestAlgorithm = "SHA-256" | "SHA-512/256" | "SHA3-256" | "BLAKE3";
export type SignatureAlgorithm = "Ed25519" | "ECDSA-P256-SHA256";
export type AeadAlgorithm = "AES-256-GCM" | "XChaCha20-Poly1305";
export type KdfAlgorithm = "HKDF-SHA-256";
export type MacAlgorithm = "HMAC-SHA-256";
export type PasswordHashAlgorithm = "Argon2id";
export type ApprovedAlgorithm =
  | DigestAlgorithm
  | SignatureAlgorithm
  | AeadAlgorithm
  | KdfAlgorithm
  | MacAlgorithm
  | PasswordHashAlgorithm;

/** Interface hooks only. This package makes no post-quantum implementation or security claim. */
export type PostQuantumAlgorithmHook = "ML-KEM" | "ML-DSA" | "SLH-DSA";
export type CryptoAgilityAlgorithm = ApprovedAlgorithm | PostQuantumAlgorithmHook;

export type AlgorithmOperation = "digest" | "signature" | "aead" | "kdf" | "mac" | "password-hash";
export type AlgorithmContext =
  | "artifact-digest"
  | "internal-high-throughput-digest"
  | "platform-signature"
  | "tenant-signature"
  | "audit-signature"
  | "provenance-signature"
  | "agent-message-signature"
  | "capital-document-signature"
  | "interop-signature"
  | "encryption-at-rest"
  | "encryption-in-transit"
  | "key-derivation"
  | "message-authentication"
  | "password-hashing";

export type AlgorithmPolicyStatus = "approved" | "disabled" | "type-hook-only";
export type AlgorithmPolicyEntry = {
  readonly algorithm: string;
  readonly operation: AlgorithmOperation | "post-quantum-hook";
  readonly status: AlgorithmPolicyStatus;
  readonly allowedContexts: readonly AlgorithmContext[];
  readonly requiresExplicitApproval: boolean;
  readonly implementedByBuiltInProvider: boolean;
};

export const algorithmRegistry: readonly AlgorithmPolicyEntry[] = [
  { algorithm: "SHA-256", operation: "digest", status: "approved", allowedContexts: ["artifact-digest", "internal-high-throughput-digest"], requiresExplicitApproval: false, implementedByBuiltInProvider: true },
  { algorithm: "SHA-512/256", operation: "digest", status: "approved", allowedContexts: ["artifact-digest", "internal-high-throughput-digest"], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "SHA3-256", operation: "digest", status: "approved", allowedContexts: ["artifact-digest"], requiresExplicitApproval: true, implementedByBuiltInProvider: false },
  { algorithm: "BLAKE3", operation: "digest", status: "approved", allowedContexts: ["internal-high-throughput-digest"], requiresExplicitApproval: true, implementedByBuiltInProvider: false },
  { algorithm: "Ed25519", operation: "signature", status: "approved", allowedContexts: ["platform-signature", "tenant-signature", "audit-signature", "provenance-signature", "agent-message-signature", "capital-document-signature"], requiresExplicitApproval: false, implementedByBuiltInProvider: true },
  { algorithm: "ECDSA-P256-SHA256", operation: "signature", status: "approved", allowedContexts: ["interop-signature"], requiresExplicitApproval: true, implementedByBuiltInProvider: false },
  { algorithm: "AES-256-GCM", operation: "aead", status: "approved", allowedContexts: ["encryption-at-rest", "encryption-in-transit"], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "XChaCha20-Poly1305", operation: "aead", status: "approved", allowedContexts: ["encryption-at-rest", "encryption-in-transit"], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "HKDF-SHA-256", operation: "kdf", status: "approved", allowedContexts: ["key-derivation"], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "HMAC-SHA-256", operation: "mac", status: "approved", allowedContexts: ["message-authentication"], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "Argon2id", operation: "password-hash", status: "approved", allowedContexts: ["password-hashing"], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "MD5", operation: "digest", status: "disabled", allowedContexts: [], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "SHA-1", operation: "digest", status: "disabled", allowedContexts: [], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "AES-ECB", operation: "aead", status: "disabled", allowedContexts: [], requiresExplicitApproval: false, implementedByBuiltInProvider: false },
  { algorithm: "ML-KEM", operation: "post-quantum-hook", status: "type-hook-only", allowedContexts: [], requiresExplicitApproval: true, implementedByBuiltInProvider: false },
  { algorithm: "ML-DSA", operation: "post-quantum-hook", status: "type-hook-only", allowedContexts: [], requiresExplicitApproval: true, implementedByBuiltInProvider: false },
  { algorithm: "SLH-DSA", operation: "post-quantum-hook", status: "type-hook-only", allowedContexts: [], requiresExplicitApproval: true, implementedByBuiltInProvider: false }
] as const;

export const prohibitedCryptoPractices = [
  "custom-cryptographic-primitives",
  "custom-random-number-generators",
  "nonce-reuse",
  "unauthenticated-encryption",
  "embedded-production-keys",
  "browser-private-keys",
  "plaintext-private-key-persistence",
  "private-key-logging"
] as const;

export type AlgorithmPolicyFailureCode =
  | "unknown-policy-version"
  | "unknown-algorithm"
  | "algorithm-disabled"
  | "algorithm-type-hook-only"
  | "algorithm-operation-mismatch"
  | "algorithm-context-invalid"
  | "explicit-approval-required";

export class AlgorithmPolicyError extends Error {
  constructor(readonly code: AlgorithmPolicyFailureCode, message: string) {
    super(message);
    this.name = "AlgorithmPolicyError";
  }
}

export type AlgorithmPolicyRequest = {
  readonly algorithm?: string;
  readonly context: AlgorithmContext | string;
  readonly explicitApproval?: boolean;
  readonly operation: AlgorithmOperation;
  readonly policyVersion: string;
};

export function enforceAlgorithmPolicy(input: AlgorithmPolicyRequest): AlgorithmPolicyEntry {
  if (input.policyVersion !== ALGORITHM_POLICY_VERSION) {
    throw new AlgorithmPolicyError("unknown-policy-version", `Unknown algorithm policy version: ${input.policyVersion}`);
  }
  const requested = input.algorithm ?? (input.operation === "digest" ? DEFAULT_DIGEST_ALGORITHM : input.operation === "signature" ? PREFERRED_SIGNATURE_ALGORITHM : "");
  const entry = algorithmRegistry.find((candidate) => candidate.algorithm === requested);
  if (!entry) throw new AlgorithmPolicyError("unknown-algorithm", `Unknown algorithm: ${requested}`);
  if (entry.status === "disabled") throw new AlgorithmPolicyError("algorithm-disabled", `${requested} is disabled`);
  if (entry.status === "type-hook-only") throw new AlgorithmPolicyError("algorithm-type-hook-only", `${requested} is a type hook only`);
  if (entry.operation !== input.operation) throw new AlgorithmPolicyError("algorithm-operation-mismatch", `${requested} cannot perform ${input.operation}`);
  if (!(entry.allowedContexts as readonly string[]).includes(input.context)) {
    throw new AlgorithmPolicyError("algorithm-context-invalid", `${requested} is not permitted for ${input.context}`);
  }
  if (entry.requiresExplicitApproval && input.explicitApproval !== true) {
    throw new AlgorithmPolicyError("explicit-approval-required", `${requested} requires explicit approval`);
  }
  return entry;
}

export function isPostQuantumTypeHook(value: string): value is PostQuantumAlgorithmHook {
  return value === "ML-KEM" || value === "ML-DSA" || value === "SLH-DSA";
}
