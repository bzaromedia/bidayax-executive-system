# Polyglot Receptionist Production Workflow

Project: The Executive Card  
Owner: BidayaX LLC  
Status: production card workflow foundation with human-approved follow-up

## Scope

The card-side receptionist workflow lets a visitor submit a routed executive request from a production executive card. It supports meeting requests, message routing, callbacks, lead qualification, general inquiries, partnership requests, and support requests.

The workflow is multilingual for English, Spanish, Arabic, French, Mandarin, Urdu, and Hindi. Live calls, direct app email sending, calendar booking, and external workflow automation remain disabled unless explicitly configured.

## Data Flow

1. Visitor opens a production executive card.
2. Visitor fills out the Executive Receptionist form and accepts the consent checkbox.
3. The card app submits to `/api/receptionist/request`.
4. The API validates the request with Zod.
5. A notification payload is prepared for `contact@theexecutivecard.com`.
6. If PostgreSQL is available, the request is stored in receptionist foundation tables and the interaction ledger records workflow events.
7. The dashboard displays request time, executive, requester name, company, language, request type, status, message preview, and follow-up state.

## Request Types

- `schedule_meeting`
- `route_message`
- `request_callback`
- `qualify_lead`
- `general_inquiry`
- `partnership_request`
- `support_request`

## Event Names

- `receptionist_request_started`
- `receptionist_request_submitted`
- `receptionist_request_failed`
- `receptionist_meeting_requested`
- `receptionist_callback_requested`
- `receptionist_lead_qualified`

## Provider Safety

The production card app prepares an email-ready payload but does not attempt live SMTP delivery unless email environment variables are configured. Missing SMTP returns `provider_unconfigured` without failing the visitor request.

If PostgreSQL is unavailable, the API returns a safe `event_store_unavailable` status instead of crashing the card.

Telephony remains safety-gated:

- `TELEPHONY_PROVIDER=mock`
- `VOICE_AGENT_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `ALLOW_PRODUCTION_CALLS=false`

## Card UX Behavior

The main executive card shows only the Executive Receptionist launcher: a short description and an `Open Receptionist` button. The full request form is not rendered inline by default.

When opened, the receptionist form appears in a compact modal/bottom sheet. The sheet is viewport-bounded, safe-area aware, and uses compact field spacing so mobile users can reach the close control and submit button without excessive page length.

Visible scrollbars are hidden across the card experience while scrolling remains available when content truly overflows. The form, modal, and fields also use horizontal overflow guards so long email addresses, URLs, select labels, and messages do not create sideways drift.

## Source Files

- `packages/types/src/receptionist.ts`
- `packages/config/receptionist/languages.ts`
- `packages/config/receptionist/request-types.ts`
- `apps/card/src/components/ExecutiveReceptionistCard.tsx`
- `apps/card/src/components/ReceptionistRequestForm.tsx`
- `apps/card/app/api/receptionist/request/route.ts`
- `apps/dashboard/app/receptionist/page.tsx`
- `apps/dashboard/src/components/ReceptionistRequestsPanel.tsx`
- `database/migrations/0010_add_receptionist_request_events.sql`

## Production Notes

The receptionist workflow is part of The Executive Card v1.0 production card release as a human-reviewed intake and routing workflow. It is not an autonomous receptionist, a live voice agent, or a direct calendar booking engine.
