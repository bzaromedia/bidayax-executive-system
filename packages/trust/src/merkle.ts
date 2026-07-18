import { canonicalUtcTimestamp } from "./canonicalization";
import { internalDigest, isHexDigest } from "./hashing";
import { enforceKeyForVerification, signBytes, signingBytes, verifySignatureBytes } from "./keys";
import type { SignatureProvider } from "./providers";
import type { MerkleBatch, MerkleProof, MerkleProofStep, SignedMerkleRoot, TrustKey } from "./types";

function hashLeaf(tenantId: string, leafDigest: string): string { return internalDigest("trust-merkle-leaf/v1", "trust-merkle-leaf-1", { leafDigest, tenantId }); }
function hashNode(tenantId: string, left: string, right: string): string { return internalDigest("trust-merkle-node/v1", "trust-merkle-node-1", { left, right, tenantId }); }

function validateLeaves(leaves: readonly string[]): readonly string[] {
  if (leaves.length === 0) throw new Error("Merkle batches reject empty input");
  if (leaves.some((leaf) => !isHexDigest(leaf))) throw new Error("Invalid Merkle leaf digest");
  const sorted = [...leaves].sort();
  if (sorted.some((leaf, index) => index > 0 && leaf === sorted[index - 1])) throw new Error("Duplicate Merkle leaves are rejected");
  return sorted;
}

function levelsFor(tenantId: string, leaves: readonly string[]): readonly (readonly string[])[] {
  const levels: string[][] = [leaves.map((leaf) => hashLeaf(tenantId, leaf))];
  while ((levels.at(-1)?.length ?? 0) > 1) {
    const current = levels.at(-1) as readonly string[];
    const next: string[] = [];
    for (let index = 0; index < current.length; index += 2) {
      const left = current[index] as string;
      next.push(hashNode(tenantId, left, current[index + 1] ?? left));
    }
    levels.push(next);
  }
  return levels;
}

export function createMerkleBatch(input: { readonly batchId: string; readonly createdAt: string; readonly leafDigests: readonly string[]; readonly tenantId: string }): MerkleBatch {
  const leaves = validateLeaves(input.leafDigests);
  const rootDigest = levelsFor(input.tenantId, leaves).at(-1)?.[0];
  if (!rootDigest) throw new Error("Merkle root construction failed");
  return Object.freeze({ batchId: input.batchId, createdAt: canonicalUtcTimestamp(input.createdAt), digestAlgorithm: "SHA-256", duplicatePolicy: "reject", leafCount: leaves.length, leafDigests: Object.freeze(leaves), oddNodePolicy: "duplicate_last", rootDigest, signedRoot: null, structureVersion: "1", tenantId: input.tenantId });
}

export async function signMerkleBatchRoot(input: { readonly batch: MerkleBatch; readonly key: TrustKey; readonly provider: SignatureProvider; readonly signedAt: string }): Promise<MerkleBatch> {
  if (input.key.purpose !== "audit_chain_signing") throw new Error("Merkle roots require audit_chain_signing purpose");
  const base = { batchId: input.batch.batchId, leafCount: input.batch.leafCount, rootDigest: input.batch.rootDigest, structureVersion: "1" as const, tenantId: input.batch.tenantId };
  const signature = await signBytes({ data: signingBytes(base), key: input.key, provider: input.provider, purpose: "audit_chain_signing", signedAt: input.signedAt, tenantId: input.batch.tenantId });
  const signedRoot: SignedMerkleRoot = { ...base, signature };
  return Object.freeze({ ...input.batch, signedRoot: Object.freeze(signedRoot) });
}

export function verifySignedMerkleRoot(batch: MerkleBatch, key: TrustKey, allowRetiredHistorical = false): boolean {
  if (!batch.signedRoot || batch.signedRoot.tenantId !== batch.tenantId || batch.signedRoot.batchId !== batch.batchId || batch.signedRoot.rootDigest !== batch.rootDigest || batch.signedRoot.leafCount !== batch.leafCount) return false;
  try {
    if (batch.signedRoot.signature.keyId !== key.keyId || batch.signedRoot.signature.keyVersion !== key.keyVersion || batch.signedRoot.signature.purpose !== "audit_chain_signing") return false;
    enforceKeyForVerification(key, { allowRetiredHistorical, keyVersion: key.keyVersion, purpose: "audit_chain_signing", signedAt: batch.signedRoot.signature.signedAt, tenantId: batch.tenantId });
    const { signature: _signature, ...base } = batch.signedRoot;
    return verifySignatureBytes({ data: signingBytes(base), key, signature: batch.signedRoot.signature.value });
  } catch { return false; }
}

export function createMerkleProof(batch: MerkleBatch, leafDigest: string, proofId: string): MerkleProof {
  const leafIndex = batch.leafDigests.indexOf(leafDigest);
  if (leafIndex < 0) throw new Error("Leaf is not in the Merkle batch");
  const levels = levelsFor(batch.tenantId, batch.leafDigests);
  const steps: MerkleProofStep[] = [];
  let index = leafIndex;
  for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
    const level = levels[levelIndex] as readonly string[];
    const right = index % 2 === 1;
    const siblingIndex = right ? index - 1 : index + 1;
    steps.push({ position: right ? "left" : "right", siblingDigest: level[siblingIndex] ?? (level[index] as string) });
    index = Math.floor(index / 2);
  }
  return Object.freeze({ batchId: batch.batchId, digestAlgorithm: batch.digestAlgorithm, leafDigest, leafIndex, proofId, proofVersion: "1", rootDigest: batch.rootDigest, steps: Object.freeze(steps), structureVersion: "1", tenantId: batch.tenantId });
}

export type MerkleProofVerification = { readonly valid: boolean; readonly reasonCodes: readonly ("tenant_mismatch" | "batch_mismatch" | "malformed_proof" | "root_mismatch")[] };
export function verifyMerkleProof(proof: MerkleProof, input: { readonly tenantId: string; readonly batch?: MerkleBatch }): MerkleProofVerification {
  const reasons: MerkleProofVerification["reasonCodes"][number][] = [];
  if (proof.tenantId !== input.tenantId) reasons.push("tenant_mismatch");
  if (input.batch && (proof.batchId !== input.batch.batchId || proof.rootDigest !== input.batch.rootDigest || proof.leafDigest !== input.batch.leafDigests[proof.leafIndex])) reasons.push("batch_mismatch");
  if (!isHexDigest(proof.leafDigest) || !isHexDigest(proof.rootDigest) || !Number.isSafeInteger(proof.leafIndex) || proof.leafIndex < 0) reasons.push("malformed_proof");
  let current = isHexDigest(proof.leafDigest) ? hashLeaf(proof.tenantId, proof.leafDigest) : "";
  let index = proof.leafIndex;
  for (const step of proof.steps) {
    const expected = index % 2 === 1 ? "left" : "right";
    if (!isHexDigest(step.siblingDigest) || step.position !== expected) { reasons.push("malformed_proof"); break; }
    current = step.position === "left" ? hashNode(proof.tenantId, step.siblingDigest, current) : hashNode(proof.tenantId, current, step.siblingDigest);
    index = Math.floor(index / 2);
  }
  if (index !== 0 || current !== proof.rootDigest) reasons.push("root_mismatch");
  const unique = [...new Set(reasons)];
  return { reasonCodes: unique, valid: unique.length === 0 };
}
