# Telephony Audit

Telephony audit events are append-only evidence emitted by the Telephony Control Plane.

Required fields:

- event ID
- event type
- tenant ID
- optional card ID
- optional session ID
- actor
- occurrence timestamp
- severity
- sanitized metadata

Audit metadata must not include provider secrets, raw authorization headers, cookies, credentials, full recordings, or unredacted sensitive payloads.
