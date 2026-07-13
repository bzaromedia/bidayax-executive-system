# Telephony Database

Migration `0016_create_telephony_domain_foundation.sql` creates the provider-independent telephony schema.

Tables:

- `telephony_phone_numbers`
- `telephony_call_sessions`
- `telephony_call_queues`
- `telephony_callback_requests`
- `telephony_appointment_requests`
- `telephony_call_transcripts`
- `telephony_voice_profiles`
- `telephony_call_recordings`
- `telephony_voicemails`
- `telephony_routing_rules`
- `telephony_escalation_policies`
- `telephony_usage_ledger`
- `telephony_audit_events`

The migration uses composite foreign keys for card/tenant consistency and append-only triggers for usage and audit evidence. It does not alter existing production telephony-preparation tables.
