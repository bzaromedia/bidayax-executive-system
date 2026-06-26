# Database Model

## Purpose

This document defines the conceptual persistence model. It does not create tables, migrations, schemas, indexes, or seed data in Phase 1.

## Primary Database Direction

PostgreSQL is the intended durable store because the system needs transactional integrity, relational querying, auditability, and strong operational familiarity.

Redis should be introduced only when a concrete need appears, such as rate limiting, short-lived workflow state, queues, or caching.

## Conceptual Domains

### Identity

Stores executive identity, public profile metadata, routing preferences, brand affiliation, and governance settings.

### Contacts

Stores people, companies, identity confidence, contact methods, consent state, and relationship metadata.

### Events

Stores canonical event ledger records and processing state.

### Scores

Stores intent scoring outputs, factor explanations, score version, and human correction state.

### Graph

Stores relationship edges or derived relationship views. The first implementation may use relational tables before a dedicated graph database is justified.

### Receptionist Workflows

Stores intake sessions, routing decisions, summaries, and handoff state.

### Follow-Ups

Stores recommended, assigned, completed, failed, and overdue follow-up actions.

### Audit And Governance

Stores access logs, data corrections, consent changes, system actions, and administrative changes.

## Conceptual Entities

- Executive.
- Identity Profile.
- Public Card.
- Contact Person.
- Company.
- Contact Method.
- Interaction Event.
- Event Processing Record.
- Intent Score.
- Score Explanation.
- Relationship Edge.
- Opportunity.
- Follow-Up Action.
- Receptionist Session.
- Audit Log.
- Consent Record.

## Modeling Rules

- Store raw event references separately from normalized fields.
- Preserve event immutability.
- Use score versions so future scoring changes can be audited.
- Keep identity confidence separate from identity claims.
- Use explicit consent and privacy fields for communication-sensitive data.
- Do not merge contacts without retaining merge history.
- Prefer simple relational modeling first.

## Phase 4 Implemented Table

Phase 4 introduces the first real database table:

```text
interaction_events
```

This table stores public executive card interaction events only. It supports future dashboard and intent-scoring phases without creating contacts, leads, CRM data, receptionist workflows, or user accounts.

Migration:

```text
database/migrations/0001_create_interaction_events.sql
```

Model documentation:

```text
database/models/interaction-event.md
```

## Phase 5 Read Model

Phase 5 creates no new tables. `apps/dashboard` reads `interaction_events` for:

- totals by event type.
- totals by executive slug.
- recent events.
- daily event counts.
- card-view-to-action conversion ratios.

Dashboard queries must not expose raw IPs or create derived contact, lead, CRM, graph, or scoring records.

## Phase 6 Implemented Table

Phase 6 introduces:

```text
intent_scores
```

This table stores deterministic, recalculable intent scores derived from anonymous `interaction_events` groups.

Migration:

```text
database/migrations/0002_create_intent_scores.sql
```

Model documentation:

```text
database/models/intent-score.md
```

Phase 6 still does not create contact, lead, CRM, receptionist, scheduling, or graph tables.

## Migration Policy

When migrations are introduced:

- Every migration must be reviewed.
- Every migration must be reversible where practical.
- Data-destructive migrations require explicit approval.
- Migrations should include comments for non-obvious constraints.
- Test data should not leak into production seeds.
- PII fields must be classified before production use.

## Remaining Non-Implementation Note

Only the Phase 4 `interaction_events` migration exists. Contact, scoring, graph, receptionist, CRM, and dashboard tables are intentionally unbuilt.
