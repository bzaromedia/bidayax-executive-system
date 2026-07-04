# Polyglot Receptionist Live Workflow

The Polyglot Receptionist is an active workflow foundation for The Executive Card. It receives card-submitted requests, validates consent, classifies language and request type, scores urgency, routes the request to the correct executive workflow, creates event-ledger records, prepares notification payloads, and exposes the result in the dashboard.

Provider dispatch depends on configured provider credentials and safety flags. When email, calendar, or telephony providers are not configured, the workflow still creates queued internal requests and dashboard-visible audit records.

## Workflow Stages

1. receive_request
2. validate_consent
3. classify_language
4. classify_request_type
5. score_urgency
6. route_to_executive
7. create_event_ledger_record
8. create_callback_or_meeting_request
9. prepare_email_notification
10. provider_dispatch_if_configured
11. dashboard_visibility
12. audit_log

## Provider Status

Provider status can be configured, provider_unconfigured, queued, sent, failed, blocked_by_policy, or requires_human_review.

For v1.0, live telephony requires provider credentials, enabled safety flags, and production validation before dispatch is treated as active. Email and calendar dispatch follow the same rule. Without those values, requests remain queued internally.

## Active Capabilities

- Card request intake through `/api/receptionist/request`.
- Inbound call webhook normalization through `/api/receptionist/inbound-call`.
- Callback request handling through `/api/receptionist/callback`.
- Calendar request handling through `/api/receptionist/calendar-request`.
- Event-ledger persistence.
- Dashboard queue visibility.
- Audit timeline creation.

## Deferred Capability

The cryptographic trust layer is the next phase and is not part of this workflow pass.
