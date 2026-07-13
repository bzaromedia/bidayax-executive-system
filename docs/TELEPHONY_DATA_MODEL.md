# Telephony Data Model

Primary entities:

- `PhoneNumber`: tenant-owned E.164 number metadata.
- `CallSession`: one provider-independent call lifecycle.
- `CallbackRequest`: callback intent created by a user, receptionist, or future call flow.
- `AppointmentRequest`: appointment intent without calendar-provider coupling.
- `CallTranscript`: transcript metadata only; no speech-to-text implementation.
- `VoiceProfile`: future voice preference metadata.
- `CallRecording`: recording metadata only; no recording implementation.
- `Voicemail`: voicemail lifecycle metadata.
- `CallQueue`: tenant-scoped queue policy.
- `CallRoutingRule`: business-hours, after-hours, language, overflow, emergency, callback, priority, and escalation routing.
- `EscalationPolicy`: routing hierarchy and human-approval policy.
- `TelephonyUsageLedgerEntry`: append-only usage and future cost evidence.
- `TelephonyAuditEvent`: append-only control-plane audit evidence.

All tenant-owned rows include `tenant_id`. Card-owned rows also include `card_id` and use composite foreign keys to prevent tenant/card mismatches.
