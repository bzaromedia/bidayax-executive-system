# Data Structures

## Executive Contact Graph

The Executive Contact Graph is the core intelligence data structure. The long-term graph links people, companies, interactions, scores, relationship strength, follow-up history, and opportunity state.

Phase 7 implements the first privacy-respecting graph slice. It links anonymous visitors, sessions, executive cards, interaction events, and intent scores. It does not create person, company, contact, CRM, receptionist, or follow-up records.

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

## Phase 7 Implemented Node Types

- `visitor`
- `session`
- `executive`
- `interaction_event`
- `intent_score`

## Phase 7 Implemented Edge Types

- `visitor_has_session`
- `session_viewed_executive`
- `session_generated_event`
- `event_targets_executive`
- `session_has_intent_score`
- `visitor_engaged_executive`

## Future Node Types

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

## Future Edge Types

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

Future graph expansion should stay small:

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

Phase 7 implements only the anonymous relational graph foundation. Person, company, relationship strength, opportunity, follow-up, CRM, receptionist, and enrichment structures remain future work.

## Polyglot Receptionist OS Foundation

Phase 8 adds receptionist foundation structures:

- receptionist interaction.
- receptionist task.
- conversation turn.
- workflow event.
- language profile.
- intent classification.
- escalation recommendation.

These structures are simulated and deterministic. They do not represent live calls, sent emails, calendar bookings, or production receptionist activity.

## Live Voice + Telephony Preparation

Phase 9 adds telephony preparation structures:

- telephony call.
- telephony call event.
- voice session.
- outbound call request.
- provider validation result.
- outbound safety gate result.

These structures prepare live integration but do not represent active autonomous calling or live AI voice runtime.

## Phase 11B Communications Data Model

Phase 11B introduces a Communications-owned data model for the channel-neutral
Communications Domain accepted by ADR-0001 and ADR-0002.

Primary structures:

- `communication`: tenant-scoped aggregate root with card scope where
  applicable, channel, direction, canonical state, state version, request
  reason, retention class, and sanitized metadata.
- `communication_participant`: tenant/card-scoped participant identity boundary
  for external contacts, executives, tenant users, systems, and adapters.
- `communication_participant_endpoint`: hashed endpoint record. Raw phone
  numbers, email addresses, authorization headers, transcripts, audio, provider
  payloads, and secrets are prohibited.
- `communication_consent_policy`: versioned consent policy by jurisdiction,
  channel, purpose, disclosure, recording, transcription, and retention class.
- `communication_consent_receipt`: immutable participant consent evidence with
  status, source, evidence reference, effective time, expiry, revocation time,
  and sanitized metadata.
- `communication_suppression`: participant suppression state with reason,
  release evidence, expiry, and audit linkage.
- `communication_lifecycle_transition`: append-only state transition record
  with sequence enforcement and terminal-state protection.
- `communication_command_idempotency_key`: tenant/card command idempotency
  record bound to authoritative actor, membership, session, grant,
  authorization decision, permission version, and policy version evidence.
- `communication_dispatch_attempt`: dispatch-attempt state with provider
  execution disabled. Queued attempts require active cited consent and fail
  closed when suppression is active.
- `communication_webhook_evidence`: durable webhook evidence limited to
  provider event identifiers, payload hashes, signature verification result,
  timestamps, and sanitized metadata.
- `communication_routing_policy`: Communications-owned routing policy data.
- `communication_receptionist_session`: receptionist-session reference that
  preserves the rule that receptionist logic cannot dispatch providers
  directly.
- `communication_adapter_health`: adapter health snapshot for future policy
  decisions.
- `communication_trust_evidence_reference`: link from Communications facts to
  Trust-owned evidence using explicit domains, artifact schemas,
  canonicalization versions, key purposes, and allowlisted fields.
- `communication_audit_event`: append-only audit evidence for allowed, denied,
  blocked, and failed Communications decisions.

Existing telephony tables remain adapter-local or legacy preparation evidence
unless a later accepted ADR or implementation package changes ownership. Phase
11B does not activate providers, production voice, live telephony, Wallet,
payments, marketplace, loyalty, rewards, Phase 11C orchestration, or Phase 12.
