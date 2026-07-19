# Telephony Adapter Boundary

## Status

Telephony remains an important execution channel, but it is no longer the permanent domain root after Phase 11A.

## Telephony-Owned Concerns

- call transport
- provider call identifiers
- ringing and answer events
- DTMF
- PSTN and SIP-specific data
- call-leg details
- provider webhook translation
- transport health

## Telephony-Prohibited Concerns

- tenant authorization
- consent policy
- suppression policy
- receptionist routing policy
- trust policy
- fraud-policy decisions
- production activation authority

## Execution Mode

Phase 11A preserves sandbox-only structural execution boundaries.

No live provider execution is authorized.
