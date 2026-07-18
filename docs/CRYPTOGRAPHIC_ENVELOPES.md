# Cryptographic Envelopes

Envelope signatures bind tenant/card scope, artifact identity and version, domain, schema/canonicalization/policy versions, digest and signature algorithms, key identity/version/purpose, signer identity/type, timestamps, prior linkage, provenance reference, status, payload, and safe metadata.

Persisted envelopes are immutable. Corrections create a new envelope linked to the prior envelope and digest. Verification never throws uncontrolled errors for untrusted input.

