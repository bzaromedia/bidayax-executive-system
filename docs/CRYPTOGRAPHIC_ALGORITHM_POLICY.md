# Cryptographic Algorithm Policy

Default digest: SHA-256. SHA-512/256 is an approved provider hook. SHA3-256 requires explicit approval. BLAKE3 is restricted to approved internal high-throughput contexts. Ed25519 is preferred; ECDSA P-256 is interop-only.

Approved interfaces cover AES-256-GCM, XChaCha20-Poly1305, HKDF-SHA-256, HMAC-SHA-256, and Argon2id. MD5, SHA-1, ECB, unauthenticated encryption, custom primitives/RNGs, nonce reuse, embedded keys, browser private keys, plaintext private-key persistence, and private-key logging are prohibited.

