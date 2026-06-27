# Security Baseline

Phase 11 introduces a baseline security posture. It does not claim SOC 2, ISO,
HIPAA, PCI, or any formal compliance certification.

## Controls

- Security headers in both Next apps.
- Safe error helpers for production responses.
- Structured logger with redaction for sensitive keys.
- Phone masking helper.
- Environment validation with safe defaults.
- Webhook signature policy checks.
- Dashboard warnings for unsafe production states.

## Headers

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` in production

## Secrets

Secrets must live in environment variables or VPS secret storage. They must not
be committed, logged, displayed, or returned by APIs.

## Voice Safety

Production voice remains blocked unless every Phase 10 safety gate passes.

