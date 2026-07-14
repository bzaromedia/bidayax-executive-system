# Telephony Provider Security

## Provider Boundary

The BidayaX telephony domain owns call state, tenant scope, card scope, audit attribution, cost policy, and production safety gates. Providers are adapters only. Provider payloads cannot directly authorize calls, grant tenant access, change card settings, or enable production calling.

## Sandbox Adapter Security

The Phase 7 sandbox adapter requires all inbound sandbox webhooks to pass:

- execution mode check: `TELEPHONY_PROVIDER_MODE=sandbox`
- strong test secret presence
- `application/json` content type
- bounded raw-body size
- required event ID
- bounded timestamp tolerance
- exact HMAC-SHA256 signature format
- timing-safe digest comparison
- replay check when a replay store is supplied
- allowlisted sandbox event type before audit normalization

## Production Gate

`TELEPHONY_PROVIDER_MODE=production` is blocked in Phase 7. `NODE_ENV=production` with sandbox mode is also reported as failed readiness. Production calling remains disabled by the existing safety gates.

## Secret Handling

Sandbox webhook secrets are never returned in readiness output, audit metadata, logs, dashboard payloads, or normalized webhook records. Weak placeholder values such as `secret`, `test`, `change-me`, and `sandbox-secret` are rejected for sandbox webhook verification.

## Future Provider Requirements

A live carrier adapter must add provider-native signature verification, durable replay storage, credential isolation, outage behavior, cost limits, and kill switches before production activation.