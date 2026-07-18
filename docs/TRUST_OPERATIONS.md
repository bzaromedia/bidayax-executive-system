# Trust Operations

Production operation requires an approved KMS or HSM integration that exposes opaque key references through the provider-neutral signing interfaces. Application processes and browsers must never receive production private keys. Remote signing must authenticate callers, authorize tenant and purpose scope, prevent key-reference substitution, and produce auditable provider events.

Operators must monitor active-key uniqueness, provider availability, signing failures, invalid verification receipts, compromised or revoked keys, audit-chain verification, unsigned required artifacts, stale Trust Center state, and transaction rollbacks. A required evidence failure blocks settings publication; it must not be bypassed by persisting settings separately.

The active algorithm policy is `trust-algorithm-policy-1`. SHA-256 is the interoperable default and Ed25519 is preferred. Explicitly approved provider hooks do not imply a built-in implementation. Unknown, disabled, operation-mismatched, or context-invalid algorithms fail closed.

Canonicalization and domain versions are operational compatibility boundaries. A new version requires fixed vectors, dual-reader planning where necessary, explicit policy review, and a new envelope—not mutation of persisted evidence.

The Trust Center and internal APIs expose public metadata and verification results only. Access remains authenticated, permission-bound, tenant/card-scoped, CSRF-protected for mutations, and non-cacheable.

