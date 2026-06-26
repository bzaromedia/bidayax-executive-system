# Event Ledger

## Purpose

The Event Ledger is the durable record of external interactions and system actions. It is the foundation that allows scoring, contact graph updates, dashboards, receptionist actions, and automations to remain explainable.

Phase 1 documents the ledger only. It does not implement storage or services.

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

Candidate event types:

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

## Non-Implementation Note

No event service, event schema, queue, database table, or processor is implemented in Phase 1.
