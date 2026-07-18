# Trust Incident Response

Treat suspected private-key access, unauthorized signing, provider-reference substitution, nonce misuse, unexpected active keys, invalid audit linkage, and unexplained verification failures as security incidents.

Immediate response:

1. Disable signing through the affected provider and preserve provider and application audit evidence.
2. Mark affected keys compromised, not merely retired, and append compromise evidence transactionally.
3. Prevent new signatures and deny historical verification with compromised keys.
4. Identify envelopes, signed actions, Merkle roots, and agent proofs associated with every affected key version.
5. Reverify affected artifacts against trusted provenance and prior-envelope evidence; classify results with structured reason codes.
6. Register and activate a replacement through the approved KMS/HSM rotation workflow.
7. Reissue required evidence as new linked envelopes. Never mutate or delete the original evidence to hide the incident.

Revocation indicates a key must no longer be trusted for signing. Compromise indicates potential unauthorized private-key use and requires broader artifact review. Retired keys may verify signatures created before their cutoff only when explicit historical-verification policy permits it; revoked and compromised keys do not receive that exception.

Do not place private keys, provider secrets, tokens, raw sensitive artifacts, audio, transcripts, or unrestricted personal data in tickets, logs, receipts, or incident documents.

