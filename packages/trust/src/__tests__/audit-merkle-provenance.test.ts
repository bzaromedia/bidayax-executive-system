import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { appendAuditChainEntry, verifyAuditChain } from "../audit-chain";
import { createMerkleBatch, createMerkleProof, signMerkleBatchRoot, verifyMerkleProof, verifySignedMerkleRoot } from "../merkle";
import { createProvenanceEvent, createProvenanceManifest, provenanceLinksArtifact, verifyProvenanceManifest } from "../provenance";
import { provenanceLifecycleEvents, type AuditChainEntry, type TrustEvent } from "../types";
import { keyFixture, signedAt } from "./test-helpers";

function event(eventId: string, occurredAt: string): TrustEvent {
  return { actorIdentityId: "identity-1", details: { result: "accepted" }, eventId, eventType: "action.verified", idempotencyKey: `idempotency-${eventId}`, occurredAt, provenanceLifecycle: null, streamId: "stream-1", structureVersion: "1", subjectId: `subject-${eventId}`, subjectType: "action", tenantId: "tenant-1" };
}

function chain(): readonly AuditChainEntry[] {
  const first = appendAuditChainEntry({ appendedAt: "2026-07-17T10:00:01.000Z", chain: [], event: event("event-1", "2026-07-17T10:00:00.000Z"), streamId: "stream-1", tenantId: "tenant-1" });
  return [first, appendAuditChainEntry({ appendedAt: "2026-07-17T10:01:01.000Z", chain: [first], event: event("event-2", "2026-07-17T10:01:00.000Z"), streamId: "stream-1", tenantId: "tenant-1" })];
}

function chainOf(length: number): readonly AuditChainEntry[] {
  const entries: AuditChainEntry[] = [];
  for (let index = 0; index < length; index += 1) {
    entries.push(appendAuditChainEntry({
      appendedAt: `2026-07-17T10:${String(index).padStart(2, "0")}:01.000Z`,
      chain: entries,
      event: event(`event-${index + 1}`, `2026-07-17T10:${String(index).padStart(2, "0")}:00.000Z`),
      streamId: "stream-1",
      tenantId: "tenant-1"
    }));
  }
  return entries;
}

describe("audit streams", () => {
  it("verifies deterministic genesis ordering and previous-digest linkage", () => {
    const entries = chain();
    expect(entries[0]?.sequence).toBe(1);
    expect(entries[1]?.previousDigest).toBe(entries[0]?.entryDigest);
    expect(verifyAuditChain(entries, { expectedStreamId: "stream-1", expectedTenantId: "tenant-1" })).toMatchObject({ reasonCodes: ["valid"], valid: true, verifiedFromCheckpoint: false });
  });

  it("detects gap, fork, replay, order, tenant, stream, and digest attacks", () => {
    const [first, second] = chain() as readonly [AuditChainEntry, AuditChainEntry];
    expect(verifyAuditChain([first, { ...second, sequence: 3 }]).reasonCodes).toContain("chain_gap");
    expect(verifyAuditChain([first, { ...first, entryDigest: "f".repeat(64), entryId: "fork" }]).reasonCodes).toContain("chain_fork");
    expect(verifyAuditChain([first, { ...second, event: first.event, eventDigest: first.eventDigest }]).reasonCodes).toContain("event_replay");
    expect(verifyAuditChain([first, { ...second, event: { ...second.event, idempotencyKey: first.event.idempotencyKey } }]).reasonCodes).toContain("event_replay");
    expect(verifyAuditChain([second, first]).reasonCodes).toContain("non_deterministic_order");
    expect(verifyAuditChain([first, { ...second, tenantId: "tenant-2" }]).reasonCodes).toContain("tenant_mismatch");
    expect(verifyAuditChain([first, { ...second, streamId: "stream-2" }]).reasonCodes).toContain("stream_mismatch");
    expect(verifyAuditChain([{ ...first, event: { ...first.event, tenantId: "tenant-2" } }]).reasonCodes).toContain("tenant_mismatch");
    expect(verifyAuditChain([{ ...first, eventDigest: "0".repeat(64) }]).reasonCodes).toContain("event_digest_mismatch");
    expect(verifyAuditChain([{ ...first, entryDigest: "0".repeat(64) }]).reasonCodes).toContain("entry_digest_mismatch");
  });

  it("supports an explicitly trusted checkpoint and rejects checkpoint substitution", () => {
    const checkpoint = { trustedDigest: "a".repeat(64), trustedSequence: 50 };
    const entry = appendAuditChainEntry({ appendedAt: signedAt, chain: [], event: event("event-51", signedAt), startingCheckpoint: checkpoint, streamId: "stream-1", tenantId: "tenant-1" });
    expect(verifyAuditChain([entry], { trustedCheckpoint: checkpoint })).toMatchObject({ valid: true, verifiedFromCheckpoint: true });
    expect(verifyAuditChain([entry], { trustedCheckpoint: { ...checkpoint, trustedDigest: "b".repeat(64) } }).reasonCodes).toContain("invalid_checkpoint");
  });


  it("defines intentional empty and single-entry verification behavior", () => {
    expect(verifyAuditChain([])).toMatchObject({ lastEntryId: null, reasonCodes: ["valid"], valid: true });
    const [single] = chainOf(1);
    expect(verifyAuditChain([single!], { expectedHeadDigest: single!.entryDigest, expectedStreamId: "stream-1", expectedTenantId: "tenant-1" })).toMatchObject({ reasonCodes: ["valid"], valid: true });
  });

  it("detects tampering at the first, middle, and final entries plus final head mismatch", () => {
    const entries = chainOf(3) as readonly [AuditChainEntry, AuditChainEntry, AuditChainEntry];
    expect(verifyAuditChain([{ ...entries[0], event: { ...entries[0].event, subjectId: "tampered" } }, entries[1], entries[2]]).reasonCodes).toContain("event_digest_mismatch");
    expect(verifyAuditChain([entries[0], { ...entries[1], previousDigest: "0".repeat(64) }, entries[2]]).reasonCodes).toContain("chain_gap");
    expect(verifyAuditChain([entries[0], entries[1], { ...entries[2], entryDigest: "0".repeat(64) }]).reasonCodes).toContain("entry_digest_mismatch");
    expect(verifyAuditChain(entries, { expectedHeadDigest: "0".repeat(64) }).reasonCodes).toContain("head_mismatch");
  });

  it("enforces duplicate sequence, unsupported algorithm, and bounded request size", () => {
    const [first, second] = chain() as readonly [AuditChainEntry, AuditChainEntry];
    expect(verifyAuditChain([first, { ...second, sequence: first.sequence }]).reasonCodes).toContain("chain_fork");
    expect(verifyAuditChain([{ ...first, digestAlgorithm: "MD5" } as AuditChainEntry & { digestAlgorithm: string }]).reasonCodes).toContain("unsupported_algorithm");
    expect(verifyAuditChain([first, second], { maxEntries: 1 }).reasonCodes).toContain("chain_too_large");
    expect(verifyAuditChain([first], { maxSerializedBytes: 1 }).reasonCodes).toContain("chain_too_large");
    expect(verifyAuditChain([first], { maxEntrySerializedBytes: 1 }).reasonCodes).toContain("entry_too_large");
  });

  it("does not mutate input and verifies entries with linear operation counts", () => {
    const entries = chainOf(8);
    const before = JSON.stringify(entries);
    const counts = { entry: 0, entry_digest: 0, event_digest: 0 };
    const result = verifyAuditChain(entries, { operationCounter: { record: (operation) => { counts[operation] += 1; } } });
    expect(result.valid).toBe(true);
    expect(JSON.stringify(entries)).toBe(before);
    expect(counts).toEqual({ entry: entries.length, entry_digest: entries.length, event_digest: entries.length });
  });
});

const leafA = createHash("sha256").update("a").digest("hex");
const leafB = createHash("sha256").update("b").digest("hex");
const leafC = createHash("sha256").update("c").digest("hex");

describe("tenant-bound Merkle batches", () => {
  it("sorts deterministically, fixes duplicate/odd policies, rejects empty/duplicates, and matches a vector", () => {
    const batch = createMerkleBatch({ batchId: "batch-1", createdAt: signedAt, leafDigests: [leafC, leafA, leafB], tenantId: "tenant-1" });
    expect(batch.leafDigests).toEqual([leafA, leafB, leafC].sort());
    expect(batch.duplicatePolicy).toBe("reject");
    expect(batch.oddNodePolicy).toBe("duplicate_last");
    expect(batch.rootDigest).toBe("d9d5a959fa0a9a7dcc0b9102ac244ab61a8b9ee361644efd1d7321bb4d98ad87");
    expect(() => createMerkleBatch({ batchId: "empty", createdAt: signedAt, leafDigests: [], tenantId: "tenant-1" })).toThrow("empty");
    expect(() => createMerkleBatch({ batchId: "dupe", createdAt: signedAt, leafDigests: [leafA, leafA], tenantId: "tenant-1" })).toThrow("Duplicate");
  });

  it("verifies tenant/batch-bound proofs and rejects index/root/tenant substitution", () => {
    const batch = createMerkleBatch({ batchId: "batch-1", createdAt: signedAt, leafDigests: [leafA, leafB, leafC], tenantId: "tenant-1" });
    for (const leaf of batch.leafDigests) expect(verifyMerkleProof(createMerkleProof(batch, leaf, `proof-${leaf}`), { batch, tenantId: "tenant-1" }).valid).toBe(true);
    const proof = createMerkleProof(batch, leafA, "proof-a");
    expect(proof).toMatchObject({ digestAlgorithm: "SHA-256", proofVersion: "1", structureVersion: "1" });
    expect(createMerkleProof(batch, leafA, "proof-a").steps).toEqual(proof.steps);
    expect(JSON.stringify(proof.steps)).toBe(JSON.stringify(createMerkleProof(batch, leafA, "proof-a").steps));
    expect(verifyMerkleProof({ ...proof, tenantId: "tenant-2" }, { tenantId: "tenant-1" }).reasonCodes).toContain("tenant_mismatch");
    expect(verifyMerkleProof({ ...proof, leafIndex: proof.leafIndex + 1 }, { batch, tenantId: "tenant-1" }).valid).toBe(false);
    expect(verifyMerkleProof({ ...proof, rootDigest: "0".repeat(64) }, { batch, tenantId: "tenant-1" }).valid).toBe(false);
  });

  it("signs and verifies immutable root evidence", async () => {
    const batch = createMerkleBatch({ batchId: "batch-1", createdAt: signedAt, leafDigests: [leafA, leafB], tenantId: "tenant-1" });
    const { key, provider } = keyFixture("audit_chain_signing");
    const signed = await signMerkleBatchRoot({ batch, key, provider, signedAt });
    expect(signed.signedRoot).not.toBeNull();
    expect(verifySignedMerkleRoot(signed, key)).toBe(true);
    expect(verifySignedMerkleRoot({ ...signed, rootDigest: "0".repeat(64) }, key)).toBe(false);
  });
});

describe("provenance lifecycle", () => {
  it("supports every exact lifecycle event with safe hash/reference storage", () => {
    const events = provenanceLifecycleEvents.map((lifecycle, index) => createProvenanceEvent({ actorIdentityId: "identity-1", eventId: `event-${String(index).padStart(2, "0")}`, lifecycle, metadata: {}, occurredAt: `2026-07-17T10:${String(index).padStart(2, "0")}:00.000Z`, priorDigest: index === 0 ? null : leafA, resultingDigest: lifecycle === "deleted" ? null : leafB, safeReference: `ref:event-${index}` }));
    expect(events.map((event) => event.lifecycle)).toEqual(provenanceLifecycleEvents);
    expect(() => createProvenanceEvent({ ...events[0]!, safeReference: "data:text/plain,secret" })).toThrow("Unsafe");
  });

  it("creates deterministic manifests, verifies links, and rejects tampering", () => {
    const eventA = createProvenanceEvent({ actorIdentityId: null, eventId: "a", lifecycle: "created", metadata: {}, occurredAt: signedAt, priorDigest: null, resultingDigest: leafA, safeReference: "urn:artifact:a" });
    const eventB = createProvenanceEvent({ actorIdentityId: null, eventId: "b", lifecycle: "published", metadata: {}, occurredAt: "2026-07-17T11:00:00.000Z", priorDigest: leafA, resultingDigest: leafB, safeReference: "ref:publish-b" });
    const link = { artifactId: "source", artifactType: "source_document", artifactVersion: "1", digest: leafC, relationship: "source" as const };
    const input = { artifactDigest: leafB, artifactId: "output", artifactType: "document", artifactVersion: "2", createdAt: signedAt, events: [eventB, eventA], links: [link], metadata: {}, schemaVersion: "provenance-1", tenantId: "tenant-1" };
    const manifest = createProvenanceManifest(input);
    expect(verifyProvenanceManifest(manifest)).toBe(true);
    expect(provenanceLinksArtifact(manifest, link)).toBe(true);
    expect(createProvenanceManifest({ ...input, events: [eventA, eventB] }).manifestDigest).toBe(manifest.manifestDigest);
    expect(verifyProvenanceManifest({ ...manifest, artifactVersion: "3" })).toBe(false);
  });
});
