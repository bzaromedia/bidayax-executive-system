# Event Ledger

## Purpose

The Event Ledger is the durable record of external interactions and system actions. It is the foundation that allows scoring, contact graph updates, dashboards, receptionist actions, and automations to remain explainable.

Phase 4 implements the first ledger slice for public executive card interactions.

## Why The Ledger Matters

Without a ledger, the system becomes a set of mutable records with unclear history. With a ledger, the system can answer:

- What happened?
- When did it happen?
- Which source produced it?
- Which identity or contact was involved?
- Which system processed it?
- What score or action resulted?
- Was it corrected later?
- Can the event be replayed?

## Event Envelope

A future event should include:

- Event ID.
- Event type.
- Source system.
- Source channel.
- Executive ID.
- Contact candidate ID when known.
- Company candidate ID when known.
- Timestamp.
- Raw payload reference.
- Normalized payload.
- Idempotency key.
- Correlation ID.
- Causation ID.
- Processing status.
- Privacy classification.
- Audit metadata.

## Event Types

Long-term candidate event types:

- `identity.created`
- `identity.updated`
- `card.viewed`
- `qr.scanned`
- `contact.form_submitted`
- `contact.saved`
- `call.received`
- `call.missed`
- `call.transcribed`
- `email.received`
- `email.replied`
- `meeting.requested`
- `meeting.booked`
- `receptionist.intake_completed`
- `receptionist.routed`
- `intent.scored`
- `graph.contact_linked`
- `follow_up.recommended`
- `follow_up.completed`

Phase 4 implemented event types:

- `qr_scan`
- `card_view`
- `vcard_download`
- `call_click`
- `email_click`
- `website_click`

## Ledger Rules

- Events are append-only.
- Corrections create new events rather than mutating historical events.
- Processing state can be tracked, but original event facts remain preserved.
- Every event should have a source and timestamp.
- Sensitive payloads should be stored according to privacy classification.
- Event consumers must be idempotent.
- Events should support replay for future scoring and graph processors.

## Event Lifecycle

```text
Capture
-> Normalize
-> Validate
-> Persist
-> Score
-> Update graph
-> Trigger workflow
-> Audit outcome
```

Phase 4 stops after `Persist`. Scoring, graph updates, dashboard display, and automation are future phases.

## Idempotency

Future ingestion must prevent duplicate events from repeated webhooks, retries, or user actions.

Idempotency keys may combine:

- Source system.
- Source event ID.
- Executive ID.
- Channel.
- Timestamp window.
- Payload hash.

## Auditability

Every important downstream decision should trace back to ledger events:

- Intent score.
- Receptionist route.
- Follow-up recommendation.
- Contact merge.
- Opportunity status update.
- Notification.

## Phase 4 Implementation

Phase 4 creates:

- `packages/types/src/events.ts` for shared event types.
- `apps/card/app/api/events/route.ts` for `POST /api/events`.
- `apps/card/src/lib/session.ts` for anonymous browser IDs.
- `apps/card/src/lib/events-client.ts` for fail-open event emission.
- `database/migrations/0001_create_interaction_events.sql` for PostgreSQL persistence.
- `database/models/interaction-event.md` for model documentation.

The API validates event payloads with Zod, generates the timestamp in PostgreSQL, parses user agent into coarse device/browser/OS fields, hashes request IPs with HMAC-SHA256, and stores only the normalized event.

## Phase 4 Privacy Rules

- No raw IP addresses are stored.
- No contact records are created.
- No lead records are created.
- No CRM data is created.
- Anonymous visitor IDs are random browser-storage IDs.
- Session IDs are random session-storage IDs.
- User-agent parsing is coarse and intended for aggregate analytics.

## Phase 4 Non-Goals

- Analytics dashboard.
- Intent scoring.
- Contact graph updates.
- Receptionist workflows.
- CRM records.
- Authentication.
- Admin tooling.
- Automation.
