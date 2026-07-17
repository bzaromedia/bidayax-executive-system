# Phase 10 Cryptographic Trust Layer

Phase 10 adds versioned cryptographic evidence without replacing compatibility hashes. Settings and brand-token FNV hashes remain unchanged; SHA-256 digests and Ed25519 envelopes are separate evidence.

The trust package owns canonicalization, domain separation, policy, public key records, envelopes, verification, audit chains, Merkle proofs, provenance, and sanitized integration evidence. Production signing is injected through opaque KMS/HSM/remote-signer references. No production private keys or test keys are stored.

Published settings use the existing settings transaction. When evidence is required, settings versions, provenance, envelope, trust event, and audit entry commit together or roll back together.

