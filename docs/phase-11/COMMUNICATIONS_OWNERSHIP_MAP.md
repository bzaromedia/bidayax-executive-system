# Communications Ownership Map

| Entity / concern | Domain owner | Physical storage owner | Lifecycle owner | Authorization owner | Audit owner | Trust owner | Adapter responsibility | Strategy |
|---|---|---|---|---|---|---|---|---|
| Communication request | Communications | Communications plan over 0016 extension | Communications | Communications | Communications | Communications | None | Extend |
| Callback request | Communications | `telephony_callback_requests` | Communications | Communications | Communications | Communications | Telephony executes only | Extend |
| Communication participant | Communications | New participant table | Communications | Communications | Communications | Communications | Transport normalization only | Add |
| Consent | Communications | `telephony_consent_policies` | Communications | Communications | Communications | Communications | None | Extend |
| Suppression | Communications | New suppression table | Communications | Communications | Communications | Communications | None | Add |
| Routing policy | Communications | `telephony_routing_rules` + new business-hours policy | Communications | Communications | Communications | Communications | None | Extend |
| Business-hours policy | Communications | New policy table | Communications | Communications | Communications | Communications | None | Add |
| Communication lifecycle | Communications | `telephony_call_sessions` + new transition log | Communications | Communications | Communications | Communications | Transport state mapping only | Extend |
| Communication transition | Communications | New append-only transition table | Communications | Communications | Communications | Communications | None | Add |
| Communication audit | Communications | `telephony_audit_events` | Communications | Communications | Communications | Communications | Safe transport references only | Extend |
| Trust evidence | Communications | Trust envelope tables from Phase 10 | Communications | Communications | Communications | Communications | Safe references only | Reuse |
| Webhook evidence | Communications | New webhook evidence table | Communications | Communications | Communications | Communications | Provide verified transport metadata only | Add |
| Adapter dispatch | Communications | New outbox / attempt tables | Communications | Communications | Communications | Communications | Execute transport only | Add |
| Provider session | Telephony | `telephony_call_sessions` transport fields | Communications lifecycle, telephony transport details | Communications | Communications | Communications | Telephony only | Extend |
| Call session | Communications | `telephony_call_sessions` | Communications | Communications | Communications | Communications | Telephony supplies transport details | Extend |
| Call attempt | Communications | New call-attempt table | Communications | Communications | Communications | Communications | Telephony returns results only | Add |
| Telephony participant | Telephony normalization under communications participant model | New participant table | Communications | Communications | Communications | Communications | Telephony only | Add |
| Phone number | Communications ownership, telephony capability | `telephony_phone_numbers` | Communications | Communications | Communications | Communications | Telephony reads capabilities only | Extend |
| Recording | Communications policy, telephony transport metadata | `telephony_call_recordings` | Communications | Communications | Communications | Communications | Telephony never owns policy | Extend |
| Transcript | Communications policy | `telephony_call_transcripts` | Communications | Communications | Communications | Communications | Telephony provides transport references only | Extend |
| Receptionist escalation | Communications + receptionist | New escalation tracking | Communications | Communications | Communications | Communications | None | Add |
| Provider health | Communications consumes, adapter reports | New failover/health evidence | Communications | Communications | Communications | Communications | Adapter reports only | Add |
| Failover event | Communications | New failover event table | Communications | Communications | Communications | Communications | Adapter never auto-enables failover | Add |
