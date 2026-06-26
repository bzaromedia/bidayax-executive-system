# Interaction Event Model

## Purpose

`interaction_events` is the first durable ledger table for BidayaX Executive System. It records meaningful public card interactions as immutable business events.

## Table

`interaction_events`

## Event Types

- `qr_scan`
- `card_view`
- `vcard_download`
- `call_click`
- `email_click`
- `website_click`

## Fields

- `id`: server-generated UUID primary key.
- `event_type`: constrained interaction event type.
- `executive_slug`: approved executive card slug.
- `session_id`: anonymous browser-session identifier generated client-side.
- `anonymous_visitor_id`: anonymous visitor identifier generated client-side.
- `source_url`: card URL active when the event was emitted.
- `referrer`: browser referrer when available.
- `user_agent`: request user-agent string.
- `device_type`: coarse device classification.
- `browser`: coarse browser classification.
- `os`: coarse operating-system classification.
- `ip_hash`: HMAC-SHA256 hash of the request IP.
- `metadata`: small JSON context for surface and action names.
- `created_at`: server-generated event timestamp.

## Privacy Rules

- Raw IP addresses are never stored.
- Anonymous IDs are random IDs, not device fingerprints.
- No names, emails, phone numbers, contact records, lead records, or CRM records are created in Phase 4.
- User-agent parsing is coarse and used only for future aggregate analytics.
- Metadata must stay small and must not include user-provided personal data.

## Future Consumers

Phase 5 can aggregate this table for dashboard metrics such as:

- card views by executive.
- QR-attributed views.
- vCard downloads.
- call, email, and website action clicks.
- repeat anonymous sessions.
- source and referrer distribution.
