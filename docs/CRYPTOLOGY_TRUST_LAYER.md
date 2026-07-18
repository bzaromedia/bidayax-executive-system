# Cryptology Trust Layer

Version `trust-algorithm-policy-1` defaults to SHA-256 and prefers Ed25519. Runtime implementations are limited to Node built-in SHA-256 and Ed25519. Other approved algorithms are provider hooks subject to context policy. ML-KEM, ML-DSA, and SLH-DSA are type hooks only and make no post-quantum claim.

Verification is fail closed and returns structured component results, reason codes, warnings, envelope/key identifiers, and a verification timestamp.

