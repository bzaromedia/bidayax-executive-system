# Cryptographic Trust Threat Model

Protected properties include tenant/card isolation, artifact identity and version, payload integrity, signer/key identity, key purpose, timestamps, correction history, provenance linkage, audit ordering, and evidence availability when policy requires it.

Primary threats include canonicalization ambiguity, Unicode collisions, floating-point ambiguity, algorithm confusion, purpose confusion, signature stripping, metadata or payload substitution, cross-tenant/card substitution, replay, expired evidence, revoked or compromised signing, rotation races, chain gaps/forks, Merkle leaf duplication, unsafe evidence leakage, browser-held keys, provider-reference substitution, and fail-open publication.

Controls include deterministic versioned canonicalization, registered domain separation, context-bound algorithm policy, complete envelope signatures, public-key version and purpose enforcement, explicit historical-verification policy, structured fail-closed verification, tenant-composite database keys, immutable evidence, append-only events, idempotency, row/advisory locks, CSRF protection, RBAC, and sanitized allowlisted integration payloads.

Audit chains prove internal ordering and tamper evidence relative to a trusted genesis or checkpoint; they do not prove external publication time. Merkle proofs prove membership in a specific tenant-bound batch; they do not prove that the source artifact was truthful. Provenance records hash/reference relationships supplied by trusted workflows; it does not independently validate source accuracy. No blockchain anchoring is implemented or claimed.

Future DealReady/Capital, Watermark, and SentinelQ integrations must use the existing registered capital, watermark, and `sentinelq.evidence` domains and the same envelope/verifier contracts. These are integration hooks, not current product-completeness or security claims.

