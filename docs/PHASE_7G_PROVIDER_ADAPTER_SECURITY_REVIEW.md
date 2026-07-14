# Phase 7G Provider Adapter Security Review

## Verdict

Pass with documented limitations.

Phase 7G reviewed the sandbox telephony provider adapter, provider readiness checks, webhook verification path, dashboard visibility, and provider-boundary documentation. The sandbox adapter remains provider-independent and test-only. Production calling remains disabled.

## Findings Corrected

- Hardened sandbox webhook signature parsing to require the exact `v1;alg=hmac-sha256;sig=<hex>` shape.
- Added bounded timestamp validation for stale and future webhook payloads.
- Added required event ID validation and replay detection support.
- Added content-type and body-size checks before JSON normalization.
- Added strong test-secret validation for sandbox mode.
- Added operation idempotency support for sandbox call actions.
- Ensured production provider mode is explicitly blocked.
- Ensured sandbox mode fails closed in production environments.

## Tests Added Or Expanded

- Valid signed sandbox webhook normalization.
- Missing, malformed, unsupported, and invalid signatures.
- Altered body, timestamp, event ID, stale timestamp, future timestamp, and replay rejection.
- Weak or missing sandbox webhook secret rejection.
- Oversized payload and invalid content-type rejection.
- Unknown sandbox event rejection.
- Operation idempotency retry and mismatched retry denial.
- Provider readiness for disabled, sandbox, and production modes.

## Limitations

- Replay storage is in-memory for Phase 7G test use only. Durable replay storage belongs with a future persistence-backed provider integration phase.
- No live carrier provider was added.
- No real webhook from Twilio, Telnyx, Vapi, Retell, Bland, SIP, WebRTC, or another provider was tested.
- Sandbox signatures are internal to BidayaX test fixtures and are not a substitute for a future carrier-specific webhook signature scheme.

## Merge Readiness

PR #4 can move to human review after validation passes because the sandbox provider is deterministic, signed, bounded, replay-aware for test use, and still cannot enable production calling.