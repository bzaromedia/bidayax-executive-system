# Trust Database

Migration `0017_create_cryptographic_trust_layer.sql` defines the trust persistence boundary. Migrations 0001–0016 remain unchanged.

The schema stores algorithm policy records, cryptographic identities, public key metadata, revocations, signed actions, trust events, immutable envelopes, audit-chain entries, Merkle batches and proofs, provenance manifests, verification receipts, and agent-message proofs. Tenant-composite foreign keys prevent cross-tenant references. Unique constraints enforce key versions, active key scope, stream sequences, idempotency, replacements, and immutable artifact evidence.

Private keys, raw encrypted key material, provider credentials, production secrets, authorization tokens, audio, and transcripts do not belong in these tables. `trust_keys` contains only public keys and opaque KMS, HSM, or remote-signer references.

Legacy settings `snapshotHash` and brand-token FNV hashes remain compatibility identifiers in their existing tables. Cryptographic SHA-256 digests and signed envelopes are separate records and must not replace, reinterpret, or silently migrate those compatibility hashes.

Append-only and immutable triggers protect revocations, actions, events, envelopes, audit entries, Merkle evidence, provenance, receipts, and proofs. Audit append serialization uses transaction-scoped advisory locks plus unique stream constraints; applications must still use database transactions and handle uniqueness conflicts as safe retries or conflicts.

