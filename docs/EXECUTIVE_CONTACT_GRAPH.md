# Executive Contact Graph

## Purpose

The Executive Contact Graph is the Phase 7 relationship intelligence layer for BidayaX Executive System. It connects anonymous visitors, sessions, executive cards, interaction events, and deterministic intent scores into a queryable structure.

The graph does not identify anonymous people. It does not enrich contacts. It does not create CRM records. It organizes first-party interaction facts so future receptionist and contact workflows can start from traceable evidence.

## Why It Works

Phase 4 records what happened. Phase 6 scores interaction groups. Phase 7 connects those records so the system can understand relationship paths over time.

Without the graph, the system has separate rows:

```text
interaction_events
intent_scores
dashboard metrics
```

With the graph, the system has structured relationships:

```text
Anonymous visitor
-> session
-> interaction events
-> executive card
-> intent score
-> factual relationship snapshot
```

## Relational Graph Model

Phase 7 uses PostgreSQL tables instead of a graph database:

- `contact_graph_nodes`
- `contact_graph_edges`
- `contact_graph_snapshots`

This keeps the implementation simple, transactional, and compatible with the existing data model.

## Node Types

- `visitor`
- `session`
- `executive`
- `interaction_event`
- `intent_score`

## Edge Types

- `visitor_has_session`
- `session_viewed_executive`
- `session_generated_event`
- `event_targets_executive`
- `session_has_intent_score`
- `visitor_engaged_executive`

## Stable Keys

Every node has a stable key:

- `visitor:{anonymous_visitor_id}`
- `session:{session_id}`
- `executive:{executive_slug}`
- `interaction_event:{event_id}`
- `intent_score:{intent_score_id}`

Stable keys make rebuilds idempotent and prevent duplicate graph nodes.

## Snapshot Rules

Relationship snapshots are factual summaries. They may say that an anonymous visitor viewed a card, downloaded a vCard, or clicked call. They must not say that the visitor is a lead, customer, investor, partner, or known contact.

## Privacy Rules

The graph uses only first-party event and score data. It does not store raw IP addresses, infer demographic traits, perform identity resolution, call external enrichment services, or create contact/company records.

## Dashboard Surface

The dashboard shows graph summaries, relationship snapshots, and engagement paths. It labels visitors as anonymous and exposes no raw identifiers.

## What Remains Unbuilt

- CRM.
- Receptionist workflows.
- Contact enrichment.
- Company records.
- Identity guessing.
- Lead pipeline.
- Sales pipeline.
- Automation.
