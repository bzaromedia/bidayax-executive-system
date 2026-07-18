import { describe, expect, it } from "vitest";
import {
  ALGORITHM_POLICY_VERSION,
  algorithmRegistry,
  AlgorithmPolicyError,
  enforceAlgorithmPolicy,
  isPostQuantumTypeHook,
  prohibitedCryptoPractices
} from "../policy";

describe("central algorithm policy", () => {
  it("registers every required approved, disabled, and type-hook algorithm", () => {
    expect(algorithmRegistry.map((entry) => entry.algorithm)).toEqual([
      "SHA-256", "SHA-512/256", "SHA3-256", "BLAKE3", "Ed25519", "ECDSA-P256-SHA256",
      "AES-256-GCM", "XChaCha20-Poly1305", "HKDF-SHA-256", "HMAC-SHA-256", "Argon2id",
      "MD5", "SHA-1", "AES-ECB", "ML-KEM", "ML-DSA", "SLH-DSA"
    ]);
    expect(algorithmRegistry.filter((entry) => entry.implementedByBuiltInProvider).map((entry) => entry.algorithm)).toEqual(["SHA-256", "Ed25519"]);
  });

  it("defaults digest/signature operations to SHA-256 and Ed25519", () => {
    expect(enforceAlgorithmPolicy({ context: "artifact-digest", operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION }).algorithm).toBe("SHA-256");
    expect(enforceAlgorithmPolicy({ context: "tenant-signature", operation: "signature", policyVersion: ALGORITHM_POLICY_VERSION }).algorithm).toBe("Ed25519");
  });

  it("requires explicit approval and exact contexts for SHA-3, BLAKE3, and P-256", () => {
    expect(() => enforceAlgorithmPolicy({ algorithm: "SHA3-256", context: "artifact-digest", operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "explicit-approval-required" }));
    expect(() => enforceAlgorithmPolicy({ algorithm: "BLAKE3", context: "artifact-digest", explicitApproval: true, operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "algorithm-context-invalid" }));
    expect(() => enforceAlgorithmPolicy({ algorithm: "ECDSA-P256-SHA256", context: "tenant-signature", explicitApproval: true, operation: "signature", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "algorithm-context-invalid" }));
    expect(enforceAlgorithmPolicy({ algorithm: "BLAKE3", context: "internal-high-throughput-digest", explicitApproval: true, operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION }).algorithm).toBe("BLAKE3");
    expect(enforceAlgorithmPolicy({ algorithm: "ECDSA-P256-SHA256", context: "interop-signature", explicitApproval: true, operation: "signature", policyVersion: ALGORITHM_POLICY_VERSION }).algorithm).toBe("ECDSA-P256-SHA256");
  });

  it.each(["MD5", "SHA-1", "AES-ECB"])("disables %s", (algorithm) => {
    expect(() => enforceAlgorithmPolicy({ algorithm, context: "artifact-digest", operation: algorithm === "AES-ECB" ? "aead" : "digest", policyVersion: ALGORITHM_POLICY_VERSION }))
      .toThrowError(expect.objectContaining<Partial<AlgorithmPolicyError>>({ code: "algorithm-disabled" }));
  });

  it("fails closed for unknown versions, algorithms, operations, and contexts", () => {
    expect(() => enforceAlgorithmPolicy({ context: "artifact-digest", operation: "digest", policyVersion: "unknown" })).toThrowError(expect.objectContaining({ code: "unknown-policy-version" }));
    expect(() => enforceAlgorithmPolicy({ algorithm: "custom", context: "artifact-digest", operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "unknown-algorithm" }));
    expect(() => enforceAlgorithmPolicy({ algorithm: "Ed25519", context: "artifact-digest", operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "algorithm-operation-mismatch" }));
    expect(() => enforceAlgorithmPolicy({ algorithm: "AES-256-GCM", context: "artifact-digest", operation: "aead", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "algorithm-context-invalid" }));
  });

  it("keeps post-quantum algorithms as non-runnable type hooks only", () => {
    for (const algorithm of ["ML-KEM", "ML-DSA", "SLH-DSA"] as const) {
      expect(isPostQuantumTypeHook(algorithm)).toBe(true);
      expect(() => enforceAlgorithmPolicy({ algorithm, context: "artifact-digest", operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION })).toThrowError(expect.objectContaining({ code: "algorithm-type-hook-only" }));
    }
  });

  it("enumerates every prohibited production practice", () => {
    expect(prohibitedCryptoPractices).toEqual(expect.arrayContaining([
      "custom-cryptographic-primitives", "custom-random-number-generators", "nonce-reuse",
      "unauthenticated-encryption", "embedded-production-keys", "browser-private-keys",
      "plaintext-private-key-persistence", "private-key-logging"
    ]));
  });
});
