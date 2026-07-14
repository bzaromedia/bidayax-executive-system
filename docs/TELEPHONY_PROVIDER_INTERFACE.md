# Telephony Provider Interface

Phase 6 adds provider contracts only:

- `TelephonyProvider`
- `CallProvider`
- `MessagingProvider`
- `RecordingProvider`
- `ConferenceProvider`
- `WebhookProvider`

No provider implementation is added. `assertProviderImplementationDisabled()` returns a blocked result with `PRODUCTION_CALLING_DISABLED` to make the phase boundary explicit.

Future adapters must translate provider payloads into BidayaX domain events without changing tenant ownership, card authorization, audit rules, or usage ledger semantics.

## Phase 7 Sandbox Adapter

Phase 7 adds an internal sandbox adapter that implements the provider-interface contract without installing a carrier SDK. It accepts deterministic sandbox operations only when `TELEPHONY_PROVIDER_MODE=sandbox`; `production` mode is blocked. Sandbox webhooks require an HMAC-SHA256 signature in `x-bidayax-sandbox-signature` and are normalized into sanitized telephony audit events.

## Phase 7G Addendum

Provider interface implementations must remain adapters. They may normalize provider events and return provider references, but they must not own tenant authorization, card authorization, production-call activation, or audit attribution. The sandbox adapter implements this boundary with deterministic test operations and signed sandbox webhook normalization only.
