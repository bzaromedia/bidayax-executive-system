# Telephony Provider Decision

## Phase 7 Decision

Phase 7 selects the internal sandbox adapter as the reference provider boundary implementation.

This is not a carrier selection and does not activate live calls. The sandbox adapter exists to prove the BidayaX Telephony Domain can call a provider-shaped interface, verify signed webhooks, normalize provider events, and emit sanitized audit evidence without depending on a third-party SDK.

## Rationale

The project already has safety-gated preparation around Twilio concepts, but Phase 7 is still too early for live provider dependency. The sandbox adapter is the correct next step because it validates:

- provider-interface shape
- idempotent deterministic operation references
- signed webhook verification
- normalized audit-event creation
- dashboard readiness visibility
- production-mode fail-closed behavior

## Providers Not Added

No Twilio, Telnyx, Vapi, Retell, Bland, SIP, WebRTC, or other live telephony provider was added in Phase 7.

## Future Decision Point

A future phase may select one carrier provider for a sandbox-to-live vertical slice. That decision must include webhook signature verification, account provisioning, credential management, cost controls, provider outage behavior, and production kill switches before any controlled production activation.
