# Phase 10 Cryptographic Trust Layer

Phase 10 adds versioned cryptographic evidence without replacing compatibility hashes. Settings and brand-token FNV hashes remain unchanged; SHA-256 digests and Ed25519 envelopes are separate evidence.

The trust package owns canonicalization, domain separation, policy, public key records, envelopes, verification, audit chains, Merkle proofs, provenance, and sanitized integration evidence. Production signing is injected through opaque KMS/HSM/remote-signer references. No production private keys or test keys are stored.

Published settings use the existing settings transaction. When evidence is required, settings versions, provenance, envelope, trust event, and audit entry commit together or roll back together.


## Approved schema expansion

Phase 10 deliberately adds `trust_merkle_proofs` as a durable Merkle-proof evidence table. The table remains inside the cryptographic trust boundary and supports proof verification, immutable evidence, historical inspection, tenant isolation, deterministic auditability, and future verification receipt export. It stores hash/index/path metadata, algorithms, versions, safe references, idempotency keys, and timestamps. It does not store private keys, raw sensitive artifact content, or blockchain anchoring data, and it does not make a blockchain anchoring claim. The migration enforces tenant-bound batch/root foreign keys, valid non-negative leaf indexes, duplicate-proof prevention, and append-only immutability.
