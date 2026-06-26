# Data Structures

## Executive Contact Graph

The Executive Contact Graph is the core intelligence data structure. It links people, companies, interactions, scores, relationship strength, follow-up history, and opportunity state.

It is documented in Phase 1 but not implemented.

## Why A Graph

Executive relationships are not flat contact records. A single person may scan a card, call later, forward an email, invite a colleague, attend a meeting, and become part of a strategic opportunity. A company may have many contacts with different levels of urgency and relationship strength.

A graph makes these relationships explicit:

```text
Person -> works at -> Company
Person -> performed -> QR Scan
Person -> placed -> Call
Person -> sent -> Email
Person -> attended -> Meeting
Interaction -> produced -> Intent Score
Person -> has -> Relationship Strength
Opportunity -> belongs to -> Company
Follow-up -> responds to -> Interaction
```

## Node Types

### Executive

Represents the owner or principal identity.

Key attributes:

- Executive ID.
- Name.
- Role.
- Organization.
- Public identity profile.
- Routing preferences.
- Governance settings.

### Person

Represents an external contact.

Key attributes:

- Person ID.
- Name.
- Email addresses.
- Phone numbers.
- Role or title.
- Company affiliation.
- Identity confidence.
- Consent and communication preferences.

### Company

Represents an organization connected to one or more people.

Key attributes:

- Company ID.
- Name.
- Domain.
- Industry.
- Size where known.
- Strategic account flag.
- Relationship summary.

### Interaction

Represents a captured external action.

Subtypes:

- QR scan.
- Card view.
- Call.
- Missed call.
- Voicemail.
- Email.
- Form submission.
- Meeting.
- Note.
- Receptionist action.
- Follow-up action.

Key attributes:

- Interaction ID.
- Type.
- Source.
- Timestamp.
- Channel.
- Raw event reference.
- Normalized summary.
- Processing state.

### Intent Score

Represents a scoring result for an interaction or contact.

Key attributes:

- Score ID.
- Numeric score.
- Category.
- Explanation.
- Factors.
- Version.
- Created time.
- Human correction status.

### Relationship Strength

Represents the strength of an executive relationship with a person or company.

Key attributes:

- Strength score.
- Last interaction time.
- Interaction count.
- Meeting count.
- Response history.
- Manual override.
- Confidence.

### Opportunity

Represents a potential business outcome.

Key attributes:

- Opportunity ID.
- Status.
- Value estimate if known.
- Strategic value.
- Source interaction.
- Related company.
- Related people.
- Next action.

### Follow-Up

Represents a recommended or completed action.

Key attributes:

- Follow-up ID.
- Trigger event.
- Owner.
- Due time.
- Status.
- Channel.
- Message summary.
- Completion result.

## Edge Types

- `WORKS_AT`: person to company.
- `SCANNED`: person or unknown actor to QR scan.
- `CALLED`: person or unknown caller to call interaction.
- `EMAILED`: person to email interaction.
- `BOOKED`: person to meeting.
- `ATTENDED`: person to meeting.
- `PRODUCED_SCORE`: interaction to intent score.
- `HAS_RELATIONSHIP_STRENGTH`: person or company to relationship strength.
- `BELONGS_TO`: opportunity to company.
- `INVOLVES`: opportunity to person.
- `TRIGGERED_FOLLOW_UP`: interaction or score to follow-up.
- `ROUTED_BY`: receptionist action to person, executive, or delegate.
- `UPDATED_BY_EVENT`: graph node to event ledger entry.

## Event Ledger Relationship

The graph is derived from the event ledger. The event ledger is the durable source of what happened. The graph is the queryable intelligence layer that links events into business context.

Rule:

```text
Event ledger records facts.
Contact graph organizes relationships.
Dashboard presents decisions.
Automation triggers actions.
```

## Minimum Future Graph

The first implemented graph should be small:

- Executive.
- Person.
- Company.
- Interaction.
- Intent Score.
- Follow-Up.

Only add Relationship Strength and Opportunity when the first vertical slice proves the need.

## Data Quality Rules

- Unknown contacts are allowed but must stay marked as unknown until matched.
- Identity confidence must be stored separately from identity data.
- Human corrections must be retained.
- Multiple channels may map to one person only when confidence is sufficient.
- A company match must not imply a person match.
- Event references must remain traceable.

## Example Query Questions

The graph should eventually answer:

- Who contacted the executive this week and why?
- Which companies have repeat engagement?
- Which interactions are high priority but not followed up?
- Which contacts moved from scan to call to meeting?
- Which receptionist actions created booked meetings?
- Which strategic companies have weak relationship strength?
- Which follow-up actions are overdue?

## Non-Implementation Note

This document defines the conceptual structure only. It does not create database tables, migrations, graph storage, indexes, or application types.
