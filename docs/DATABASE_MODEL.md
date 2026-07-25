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

## Phase 7 Implemented Tables

Phase 7 introduces:

```text
contact_graph_nodes
contact_graph_edges
contact_graph_snapshots
```

These tables store a relational graph derived from `interaction_events` and `intent_scores`.

Migration:

```text
database/migrations/0003_create_contact_graph.sql
```

Model documentation:

```text
database/models/executive-contact-graph.md
```

Phase 7 still does not create contact, company, lead, CRM, receptionist, scheduling, or enrichment tables.

## Phase 8 Implemented Tables

Phase 8 introduces:

```text
receptionist_interactions
receptionist_tasks
receptionist_conversation_turns
receptionist_workflow_events
```

These tables store simulated receptionist foundation data.

Migration:

```text
database/migrations/0004_create_receptionist_foundation.sql
```

Model documentation:

```text
database/models/receptionist-os.md
```

Phase 8 still does not create live telephony records, call recordings, sent email records, calendar booking records, CRM tables, payment tables, or external workflow state.

## Phase 9 Implemented Tables

Phase 9 introduces:

```text
telephony_calls
telephony_call_events
voice_sessions
outbound_call_requests
```

These tables store call preparation, lifecycle, voice session, and outbound approval records.

Migration:

```text
database/migrations/0005_create_telephony_preparation.sql
```

Model documentation:

```text
database/models/telephony-integration.md
```

Phase 9 still does not store raw recordings, raw audio streams, real provider execution records, sent email records, calendar booking records, payment data, contact enrichment, or CRM pipeline records.

## Phase 11B Communications Data Model Tables

Phase 11B adds the Communications-owned persistence boundary accepted by
ADR-0002. Migration `database/migrations/0018_create_communications_data_model.sql`
creates:

```text
communications
communication_participants
communication_participant_endpoints
communication_consent_policies
communication_consent_receipts
communication_suppressions
communication_lifecycle_transitions
communication_command_idempotency_keys
communication_dispatch_attempts
communication_webhook_evidence
communication_routing_policies
communication_receptionist_sessions
communication_adapter_health
communication_trust_evidence_references
communication_audit_events
```

The migration preserves single-writer Communications ownership for product
policy, consent, suppression, lifecycle, command idempotency, dispatch-attempt
state, webhook evidence, routing policy, receptionist-session references,
adapter health, trust references, and audit evidence. Telephony tables remain
adapter-local or legacy preparation evidence unless a later accepted decision
changes ownership.

The database model enforces tenant scope, card scope where applicable,
tenant-composite relationships, append-only evidence, authorization evidence,
active-session and active-grant checks for command writes, active-consent
requirements for queued dispatch attempts, suppression denial, disabled
provider dispatch, durable idempotency, explicit lifecycle transitions, and
sanitized audit, trust, webhook, and metadata records.

Phase 11B does not create provider activation, production telephony,
production voice, live webhooks, orchestration runtime, Wallet, payment,
marketplace, loyalty, rewards, or Phase 12 implementation tables.

## Migration Policy

When migrations are introduced:

- Every migration must be reviewed.
- Every migration must be reversible where practical.
- Data-destructive migrations require explicit approval.
- Migrations should include comments for non-obvious constraints.
- Test data should not leak into production seeds.
- PII fields must be classified before production use.

## Remaining Non-Implementation Note

The implemented persistence model now includes the Phase 4 event ledger, Phase
6 intent scores, Phase 7 contact graph tables, Phase 8 receptionist foundation
tables, Phase 9 telephony preparation tables, and the Phase 11B
Communications-owned data-model tables. Contact, company, CRM, live provider
execution, scheduling execution, enrichment, payment, Wallet, and production
automation tables remain intentionally unbuilt.
