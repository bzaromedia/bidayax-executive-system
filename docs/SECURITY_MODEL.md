# Security Model

## Purpose

BidayaX handles executive identity, contact information, interaction history, call and email metadata, scoring outcomes, and follow-up actions. Security and privacy must be built into the architecture before implementation.

Phase 1 documents the security model only.

## Security Principles

- Least privilege by default.
- Explicit access boundaries between executives, delegates, operators, and administrators.
- Audit important reads and writes.
- Classify sensitive data before storage.
- Preserve consent state.
- Encrypt sensitive data in transit and at rest.
- Prefer simple controls that can be tested.
- Avoid collecting data that is not needed.
- Make automated decisions explainable.

## Data Classes

### Public Data

Examples:

- Public executive card fields.
- Public business links.
- Public company description.

### Internal Business Data

Examples:

- Interaction summaries.
- Dashboard metrics.
- Follow-up status.
- Opportunity labels.

### Personal Data

Examples:

- Contact names.
- Emails.
- Phone numbers.
- Job titles.
- Company affiliation.

### Sensitive Interaction Data

Examples:

- Call transcripts.
- Voicemails.
- Email bodies.
- Private notes.
- Sentiment analysis.
- Intent score explanations.

### Security And Audit Data

Examples:

- Access logs.
- Consent changes.
- Administrative actions.
- Authentication events.

## Access Roles

Candidate roles:

- Executive.
- Executive delegate.
- Receptionist operator.
- Administrator.
- System service.
- Auditor.

## Consent And Communication

The system should track:

- Whether a contact provided information directly.
- Which channel produced the information.
- Whether follow-up is allowed.
- Whether communication preferences are known.
- Whether data was enriched from a third party.
- Whether a contact requested deletion or correction.

## Threat Model

Key risks:

- Unauthorized access to executive contacts.
- Exposure of call transcripts or notes.
- Incorrect contact merges.
- Over-automated follow-up to sensitive contacts.
- QR abuse or spam traffic.
- Webhook replay or spoofing.
- Leaked integration credentials.
- Excessive data retention.
- Unexplained automated scoring decisions.

## Phase 4 Privacy Controls

The QR Interaction Event Ledger stores interaction telemetry only.

Phase 4 collects:

- event type.
- executive slug.
- anonymous visitor ID.
- anonymous session ID.
- source URL.
- referrer.
- user agent.
- coarse device/browser/OS fields.
- hashed IP value.
- small action metadata.

Phase 4 does not collect:

- raw IP addresses.
- contact names.
- contact emails.
- contact phone numbers.
- message bodies.
- login identity.
- CRM records.
- lead records.

IP hashes use HMAC-SHA256. Production deployments must set `BIDAYAX_IP_HASH_SECRET` so IP-derived values are protected by an environment-specific secret.

## Phase 5 Dashboard Privacy Controls

The Executive Interaction Dashboard shows anonymous ledger summaries only.

Phase 5 may display:

- event type.
- executive slug or executive display name.
- coarse device type.
- coarse browser.
- coarse operating system.
- source or referrer host.
- event timestamp.
- aggregate counts and ratios.

Phase 5 must not display:

- raw IP addresses.
- IP hashes.
- anonymous visitor IDs.
- session IDs.
- contact records.
- lead records.
- names, emails, or phone numbers from visitors.
- private notes or message bodies.

## Phase 6 Scoring Privacy Controls

The Executive Intent Scoring Engine scores behavior, not identity.

Phase 6 may use:

- event type.
- anonymous visitor ID.
- anonymous session ID.
- executive slug.
- source or referrer presence.
- coarse device/browser/OS completeness.
- event timestamps.

Phase 6 must not use:

- raw IP addresses.
- IP hashes.
- demographic inference.
- location-based discrimination.
- identity guessing.
- contact enrichment.
- external data brokers.
- CRM data.
- receptionist notes.

Dashboard labels must describe rows as anonymous signals, not confirmed leads or known contacts.

## Phase 7 Graph Privacy Controls

The Executive Contact Graph organizes anonymous first-party relationship structure.

Phase 7 may use:

- anonymous visitor ID.
- anonymous session ID.
- executive slug.
- interaction event IDs.
- intent score IDs.
- event types.
- intent tiers and scores.
- factual engagement summaries.

Phase 7 must not use or expose:

- raw IP addresses.
- IP hashes in dashboard surfaces.
- identity guessing.
- demographic inference.
- contact enrichment.
- external data brokers.
- contact records.
- company records.
- receptionist notes.

Dashboard labels must describe rows as anonymous visitors, visitor signals, relationship snapshots, or engagement paths.

## Phase 8 Receptionist Privacy Controls

The Polyglot Receptionist OS foundation stores simulated receptionist data only.

Phase 8 may use:

- simulated interaction type.
- simulated channel.
- simulated language and dialect metadata.
- limited optional caller or sender label.
- executive slug.
- anonymous visitor ID and session ID when present.
- simulated summary.
- simulated sentiment and priority.
- generated task descriptions.
- workflow event payloads.

Phase 8 must not use or store:

- raw call recordings.
- real voice session media.
- payment data.
- sensitive personal data.
- inferred protected traits.
- external enrichment results.
- real sent email bodies.
- calendar booking confirmations.
- production phone routing data.

Dashboard labels must describe receptionist rows as simulated or foundation data.

## Phase 9 Telephony Safety Controls

The Live Voice + Telephony Integration Preparation layer stores call preparation metadata only.

Phase 9 may use:

- provider name.
- provider call ID.
- call direction.
- from and to phone number fields.
- executive slug.
- call status.
- language and dialect metadata.
- call lifecycle events.
- outbound approval status.
- voice session metadata.

Phase 9 must not use or store:

- raw call recordings.
- raw audio streams.
- payment data.
- contact enrichment results.
- inferred identity from phone numbers.
- real sent email bodies.
- calendar booking confirmations.
- uncontrolled AI voice output.

Dashboard phone numbers should be masked when displayed. Logs must not include secrets, raw payloads, or sensitive phone details.

## Controls For Future Implementation

- Strong authentication.
- Role-based access control.
- Scoped service credentials.
- Webhook signature verification.
- Idempotency and replay protection.
- Rate limiting for public surfaces.
- Input validation.
- Audit logs for sensitive operations.
- Data retention policy.
- Backup and restore process.
- Secret management.

## AI And Automation Safety

AI-assisted receptionist and scoring workflows must:

- Preserve uncertainty.
- Avoid unsupported claims.
- Support human review.
- Store explanations.
- Respect consent and channel rules.
- Avoid sending sensitive messages without approval.
- Escalate high-risk interactions.

## Security Acceptance Questions

Before any future feature ships:

- What data does it collect?
- Why is that data needed?
- Who can see it?
- How is it protected?
- How is it audited?
- How can it be corrected or deleted?
- What happens if the automation is wrong?

## Phase 5 Identity Security Addendum

Phase 5 moves settings access from temporary signed settings tokens to production identity-provider authentication plus internal BidayaX authorization. Browser-controlled tenant, role, card, and permission claims are not authoritative.

Security controls added:

- WorkOS AuthKit provider token verification.
- Server-side OAuth transaction storage with hashed state and encrypted PKCE verifier.
- Internal tenant membership and card grant resolution.
- Opaque HttpOnly application sessions with hashed persistence.
- Double-submit CSRF for unsafe identity actions.
- Revocable and expiring sessions.
- Append-only identity audit events.
- Provider webhook replay protection.
- Fail-closed production configuration.
- Development identity simulation blocked in production.

Telephony providers and production calling remain disabled.

## Phase 7G Telephony Security Note

No telephony provider credentials are required or accepted for Phase 7G. Sandbox webhook secrets are test-only and must not be exposed to client bundles, logs, audit metadata, or readiness payloads. Production calling remains disabled.
