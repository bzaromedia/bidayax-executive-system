# Merkle Evidence

Leaves are tenant-bound SHA-256 digests sorted lexically. Empty batches and duplicate leaves are rejected. An odd final node is duplicated. Proofs bind tenant, batch, index, leaf and root. Signed roots use audit-chain signing keys and immutable batch storage.


## Durable proof evidence

`trust_merkle_proofs` is an approved Phase 10 schema expansion for durable inclusion-proof evidence. Persisted proofs support historical verification, tenant-scoped proof inspection, verification receipts, and deterministic auditability without rebuilding proof paths. The table stores hashes, indexes, deterministic proof-step JSON, digest algorithm, proof version, batch/root references, idempotency keys, and timestamps only. It stores no private-key material and no raw sensitive artifacts. It is not a blockchain component and creates no blockchain anchoring claim.
