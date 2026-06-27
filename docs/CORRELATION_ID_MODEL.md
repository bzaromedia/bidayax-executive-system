# Correlation ID Model

Correlation IDs connect logs, telemetry events, and request handling without
becoming identity.

## Rules

1. Reuse `x-bidayax-correlation-id` when it is valid.
2. Generate a new ID when missing.
3. Propagate to logs and telemetry where practical.
4. Never encode identity, phone numbers, secrets, or session data in the ID.
5. Never use correlation IDs as CRM or contact identifiers.

