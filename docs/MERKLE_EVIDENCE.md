# Merkle Evidence

Leaves are tenant-bound SHA-256 digests sorted lexically. Empty batches and duplicate leaves are rejected. An odd final node is duplicated. Proofs bind tenant, batch, index, leaf and root. Signed roots use audit-chain signing keys and immutable batch storage.

