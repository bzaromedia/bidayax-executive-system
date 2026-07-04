# Receptionist OS

The Executive Card Receptionist OS is an active v1.0 workflow foundation that routes executive card, callback, meeting, and inbound-call requests into the identity-to-intelligence loop.

It is not a live autonomous call center by default. Live telephony, email dispatch, calendar dispatch, and realtime AI voice sessions require configured providers, enabled safety flags, and production validation before they are treated as active capabilities.

## System Role

```text
Executive Identity
-> Digital Card
-> QR / Phone / Email / Scheduling Request
-> Polyglot Receptionist Workflow
-> Event Ledger
-> Intent + Trust Scoring
-> Contact Graph
-> Dashboard Queue
-> Human-Approved Follow-Up
```

## Implemented v1.0 Capabilities

- Card request intake through `/api/receptionist/request`.
- Inbound call webhook normalization through `/api/receptionist/inbound-call`.
- Callback request intake through `/api/receptionist/callback`.
- Calendar request intake through `/api/receptionist/calendar-request`.
- Provider-safe simulated inbound call workflow in `services/polyglot-receptionist/src/call-workflow.ts`.
- Language detection/defaulting for English, Spanish, Arabic, French, Mandarin, Hindi, Urdu, and Russian where applicable.
- Intent routing for sales, investor, customer, partner, vendor, media, legal, emergency, personal, spam, and unknown calls.
- Executive availability policy decisions for meeting booking, callback, message capture, lead qualification, spam blocking, transfer eligibility, and human approval.
- Voice trust scoring using caller identity, company context, repeat contact, language confidence, intent sensitivity, and spam risk.
- Callback priority scoring.
- Multilingual conversation memory with original transcript, English executive summary, action items, intent, and confidence.
- Dashboard visibility in `apps/dashboard/app/receptionist/page.tsx`.
- Event ledger persistence through the existing card server workflow.
- Human approval gates for sensitive or uncertain actions.

## Provider-Gated Capabilities

The workflow is provider-agnostic. These capabilities are wired as interfaces and safety gates, but they do not dispatch in production unless the owner configures and validates provider credentials:

- Twilio Voice or SIP media stream handling.
- Realtime speech-to-speech agent sessions.
- Speech-to-text transcription provider.
- Text-to-speech provider.
- Translation provider.
- Live email sending.
- Live calendar booking.
- Live call transfer.

## Workflow States

1. Incoming request received.
2. Consent and safety validated.
3. Caller language and dialect classified.
4. Intent classified.
5. Urgency and voice trust scored.
6. Executive availability policy evaluated.
7. Callback, meeting, message, lead, transfer, approval, or spam workflow selected.
8. Event ledger payload prepared or persisted.
9. Contact graph update prepared.
10. Notification payload prepared.
11. Provider dispatch checked against provider status and safety flags.
12. Dashboard visibility and audit timeline recorded.

## Human Approval

Human approval is required for legal, emergency, investor-sensitive, live transfer, low-trust, or high-urgency situations. The receptionist must not approve contracts, accept payments, make legal/medical/financial claims, disclose private executive information, or bypass policy.

## Integration Points

- `services/polyglot-receptionist`: workflow engine, call workflow algorithms, provider-safe interfaces, safety guards.
- `services/telephony`: telephony provider readiness and runtime safety gates.
- `apps/card`: public card receptionist request APIs and event persistence.
- `apps/dashboard`: receptionist queue, trust score, urgency, provider status, callback/meeting state, and audit timeline.
- `database/migrations/0004_create_receptionist_foundation.sql`: receptionist interaction, task, conversation, and workflow event storage.

## Current Limitation

v1.0 can run the receptionist workflow and queue internal follow-up records. Live provider dispatch remains disabled until the required provider credentials and production safety flags are configured and tested.
