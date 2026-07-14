# Telephony API

Phase 6 designs provider-neutral API boundaries. Live endpoints are not activated for calling.

Future REST surface:

- `GET /api/telephony/phone-numbers`
- `GET /api/telephony/calls`
- `POST /api/telephony/calls/request`
- `GET /api/telephony/queues`
- `POST /api/telephony/callbacks`
- `POST /api/telephony/appointments`
- `GET /api/telephony/routing-rules`
- `GET /api/telephony/usage`
- `GET /api/telephony/audit`

All routes must derive tenant, role, card access, and actor identity from the Phase 5 application session. No route may trust browser-supplied tenant, role, card, provider, or actor headers.
