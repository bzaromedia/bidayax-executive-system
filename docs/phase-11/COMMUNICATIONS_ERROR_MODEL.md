# Communications Error Model

## Channel-Neutral Errors

- authorization denied
- policy blocked
- consent missing
- suppression active
- outside business hours
- no eligible channel
- no eligible adapter
- idempotency conflict
- invalid transition
- adapter unavailable
- transient execution failure
- permanent execution failure
- kill switch active
- fraud policy blocked

## Error Rules

- errors are transport-neutral at the domain boundary
- provider-specific failures are translated before leaving the adapter
- no secrets or sensitive payloads appear in error messages
- retry classification is explicit
