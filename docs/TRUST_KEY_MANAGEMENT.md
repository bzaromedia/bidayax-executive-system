# Trust Key Management

Only public keys and opaque provider references are persisted. Statuses are pending, active, retiring, retired, revoked, and compromised. Purposes are platform artifact, tenant artifact, settings, audit chain, provenance, capital document, agent message, and verification-only.

Only active purpose-matched keys sign. Revoked and compromised keys never sign. Retired historical verification requires explicit policy and respects the signing cutoff.

