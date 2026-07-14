# Redaction Policy

## Purpose

Redaction prevents raw sensitive visitor content from being placed into runtime audit previews.

## Current Redactions

The Phase 9 runtime redacts:

- Email addresses.
- Phone numbers.
- HTTP and HTTPS links.
- API keys.
- Bearer tokens.
- Cookies.
- Password-like values.
- Secret-like values.

## Limits

Redaction is deterministic and pattern-based. It is not a guarantee that every possible personal, confidential, or regulated datum is removed. Future phases should add deeper PII classification, locale-aware phone parsing, allowlisted link handling, and red-team test sets.
