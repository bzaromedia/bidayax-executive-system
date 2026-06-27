# Privacy-Safe Telemetry

Telemetry must never store:

- raw IP addresses
- secrets
- API keys
- auth tokens
- raw provider payloads
- raw call recordings
- raw audio
- payment data
- sensitive personal traits
- unnecessary personal data

## Sanitization

The telemetry service redacts sensitive metadata keys and masks phone numbers.
Error records store safe messages instead of raw stack traces.

## Retention

Suggested defaults:

- `telemetry_events`: 90 days
- `telemetry_metrics`: 180 days
- `telemetry_error_events`: 180 days
- `telemetry_safety_gate_events`: 365 days

Phase 12 reports retention status but does not auto-delete data.

