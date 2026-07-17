# Security Acceptance Tests

Phase 10 is acceptable only when the following controls pass:

- Existing settings and brand-token FNV compatibility vectors remain unchanged, while cryptographic digests are stored separately.
- Canonicalization rejects unsupported versions, undefined values, functions, symbols, cycles, binary values, floats, unsafe integers, invalid timestamps, sparse arrays, accessors, and oversized payloads.
- Every registered domain produces distinct bindings across tenant, nullable card, artifact type/ID/version, schema, canonicalization version, and payload; unregistered domains fail.
- Unknown, disabled, type-hook-only, operation-invalid, and context-invalid algorithms fail closed. Only SHA-256 and Ed25519 are claimed as built-in implementations.
- Only active, purpose-matched keys sign. Rotation is transactional. Revoked and compromised keys cannot sign. Retired historical verification requires explicit policy and respects the cutoff.
- Envelope payload or metadata substitution, stripping, malformed signatures, expiration, scope mismatch, broken prior linkage, and invalid provenance return structured failures without uncontrolled exceptions.
- Settings publication and required trust evidence commit or roll back atomically.
- Identity, telephony, and receptionist evidence rejects secrets, tokens, authorization data, raw provider payloads, unsafe PII, audio, recordings, and transcripts.
- Internal APIs require authenticated sessions, exact permissions, tenant/card boundaries, CSRF validation for mutations, and actual cryptographic/audit/Merkle verification.
- Audit chains detect gaps, forks, replay, tenant/stream mismatch, invalid genesis/checkpoints, and digest tampering. Merkle batches reject empty/duplicate leaves and verify tenant-bound proofs. Provenance detects digest and lifecycle-link tampering.
- Trust Center derives scope from authentication, displays no secrets, and exposes loading, operational, degraded, unavailable, verification-failed, revoked-key, test-key-warning, no-production-provider, and no-signed-artifacts states.
- Production signing remains disabled until an approved KMS or HSM is configured. No production test keys or private-key material exist in source, persistence, logs, APIs, or browser bundles.

DealReady/Capital, Watermark, and SentinelQ acceptance tests are required when those integrations are implemented. Their registered domains and type hooks do not by themselves establish deployed functionality.

