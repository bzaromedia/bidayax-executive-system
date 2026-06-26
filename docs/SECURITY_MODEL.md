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
