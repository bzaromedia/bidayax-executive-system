# Trust Rollback

Cryptographic evidence is append-only, so rollback means restoring application behavior or issuing corrective evidence—not deleting or editing envelopes, provenance, audit entries, revocations, Merkle batches, receipts, or proofs.

For a failed settings publication, the database transaction rolls back settings versions and all required trust evidence together. A retry must reuse the validated request identity and idempotency policy. Never commit the settings result after evidence creation fails.

For an incorrect but committed artifact, create a corrected artifact version and a new envelope linked through `previousEnvelopeId` and `previousDigest`. Preserve the prior record and mark lifecycle/status changes through supported immutable evidence.

Algorithm, canonicalization, schema, or domain-policy rollback requires an explicit supported version. Do not reinterpret old signatures with a different policy version or rewrite canonical bytes. Key rotation rollback must not reactivate a revoked or compromised key; activate a separately registered approved key version instead.

Database rollback must preserve migrations 0001–0016 and existing FNV compatibility hashes. Migration 0017 is additive. Destructive removal of trust evidence is not an operational rollback mechanism.

