# Redaction Policy

## Purpose

Redaction prevents raw sensitive visitor content from being placed into runtime audit previews.

## Current Redactions

The Phase 9G runtime redacts:

- Standard and obfuscated email addresses.
- Full-width email separators after Unicode normalization.
- Phone numbers, including common formatted and Unicode-normalized digits.
- HTTP and HTTPS links.
- API keys.
- Bearer tokens.
- Cookies.
- Password-like values.
- Secret-like values.
- Token-like values.
- PEM private-key blocks.

## Bounds

Transcript previews are capped at 240 characters or a smaller supplied policy limit. Larger requested preview limits are clamped to 240.

## Limits

Redaction is deterministic and pattern-based. It is not a guarantee that every possible personal, confidential, or regulated datum is removed. Future phases should add deeper PII classification, locale-aware phone parsing, allowlisted link handling, multilingual adversarial test sets, and red-team corpora.
