# Communications Security Boundary

## Mandatory Controls

- identity-bound authorization
- explicit tenant scope
- explicit card scope where applicable
- fail-closed policy evaluation
- no trust in caller ID as identity
- raw-body preservation for future webhook verification
- no provider event accepted before signature verification
- durable replay protection in later phases
- secret isolation outside repository storage
- evidence sanitization
- transcript and recording exclusion from trust evidence
- consent enforcement
- suppression enforcement
- kill-switch precedence
- fraud-policy evaluation
- bounded retries
- command idempotency
- append-only lifecycle evidence
- safe error reporting
- no sensitive information in logs

## Explicit Non-Claims

This phase does not claim universal legal compliance.

Jurisdiction-specific legal review remains required for:

- recording consent
- transcription retention
- outbound calling consent
- do-not-call obligations
- emergency calling obligations
- data residency
- legal hold and deletion
