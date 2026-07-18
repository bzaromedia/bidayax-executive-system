# Trust Testing

Trust tests cover canonicalization fixed vectors, every registered security domain, algorithm contexts and prohibitions, key lifecycle transitions, purpose enforcement, envelope substitution and stripping, structured verification reasons, audit gaps/forks/replay, checkpoints, deterministic Merkle roots/proofs, signed roots, provenance lifecycle linkage, authorization boundaries, evidence redaction, atomic settings publication, and Trust Center state derivation.

Compatibility suites must continue asserting the existing `settings-fnv1a-*` and brand-token `fnv1a-*` results. Cryptographic tests assert separate SHA-256 digests and must not update compatibility vectors.

Automated signing tests may create ephemeral Ed25519 keys only inside test processes. Test private keys must not be committed, persisted, logged, shipped to browsers, reused as production fixtures, or registered in production databases. Production readiness requires KMS or HSM-backed signing and must report test-key metadata as a warning.

Migration validation checks numbering and textual contracts. Where PostgreSQL is available, disposable-database tests should apply the complete migration chain and exercise uniqueness, tenant isolation, immutable triggers, append-only triggers, transaction rollback, concurrent rotation, concurrent audit append, and revocation races.

Future algorithm or canonicalization versions require new fixed vectors and negative tests. ML-KEM, ML-DSA, and SLH-DSA tests may validate type-hook rejection only; they must not claim post-quantum protection.

