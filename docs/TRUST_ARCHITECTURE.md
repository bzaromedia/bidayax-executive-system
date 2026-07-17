# Trust Architecture

Security-domain payload → deterministic canonical form → domain-bound SHA-256 digest → immutable signed envelope. Public key resolution is tenant-, purpose-, and version-bound. Optional prior-envelope and provenance resolvers validate correction history.

Audit events are linked through tenant stream sequence and previous digest. Merkle batches sort leaves, reject duplicates and empty input, duplicate the final odd node, and optionally sign the root.

Identity, telephony, and receptionist packages expose sanitized signed-evidence adapters. They reject secrets, tokens, audio, recordings, transcripts, direct PII, and raw provider payloads.

