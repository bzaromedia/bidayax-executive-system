# Trust Key Revocation

Revocation or compromise updates key status and appends matching immutable evidence in one transaction. The internal API requires `trust.keys.manage` for mutations and `trust.revocations.read` for inspection. Compromised evidence requires re-verification of affected envelopes.

