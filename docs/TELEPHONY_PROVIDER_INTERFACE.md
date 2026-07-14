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
