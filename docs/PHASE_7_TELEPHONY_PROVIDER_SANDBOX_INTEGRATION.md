# Phase 7 Telephony Provider Sandbox Integration

Phase 7 adds a provider-adapter sandbox path for the BidayaX Telephony Domain Foundation. It does not enable production calling and does not add a live telephony provider SDK.

## Implemented

- Sandbox provider adapter implementing the Phase 6 provider-interface contract.
- Deterministic sandbox call-operation responses for inbound answer, outbound dial, transfer, hangup, and message operations.
- Sandbox webhook signature helper using HMAC-SHA256 with `TELEPHONY_SANDBOX_WEBHOOK_SECRET`.
- Sandbox webhook verification and normalized audit-event creation with sanitized metadata only.
- Provider execution-mode readiness via `TELEPHONY_PROVIDER_MODE`.
- Dashboard visibility for provider mode, sandbox adapter status, and sandbox webhook signing status.
- Unit tests for sandbox operations, production-mode blocking, signed webhooks, invalid webhooks, and readiness status.

## Execution Modes

- `disabled`: default. No provider operations are accepted.
- `mock`: existing safety-gated mock behavior remains available.
- `sandbox`: deterministic adapter behavior for local/test integration only.
- `production`: intentionally blocked in Phase 7.

## Required Local/Test Configuration

```text
TELEPHONY_PROVIDER_MODE=sandbox
TELEPHONY_SANDBOX_WEBHOOK_SECRET=<test-only-secret>
```

These values are for test and sandbox validation only. Do not use production credentials.

## Explicit Exclusions

- No Twilio SDK installation.
- No Telnyx, Vapi, Retell, Bland, SIP, or WebRTC integration.
- No phone-number provisioning.
- No inbound or outbound production calling.
- No recording, transcription, voicemail processing, or live voice runtime activation.

## Production Status

Production calling remains disabled. The sandbox adapter is an internal test harness for provider-boundary validation before future provider work.

## Phase 7G Security Review Addendum

Phase 7G hardened the sandbox provider adapter with strict HMAC signature format validation, timestamp bounds, content-type checks, body-size limits, event replay detection, strong test-secret validation, operation idempotency, and explicit production-mode blocking.

The sandbox adapter remains internal and test-only. No live provider, phone number, SIP/WebRTC layer, recording, transcription, or production calling was added.
