# Polyglot Receptionist OS

The Polyglot Receptionist OS is the front-office automation layer for The Executive Card. It connects executive identity, phone, chat, voice-chat transcript mode, traditional request forms, callback requests, scheduling preparation, event logging, contact intelligence, dashboard visibility, and human-approved follow-up.

## Interaction Modes

1. Phone Call Mode: inbound business phone webhooks normalize into receptionist workflow requests. Live call answering requires configured telephony and realtime voice providers.
2. ChatGPT-Style Text Chat Mode: visitors can send a concise message from the card. The request feeds the same workflow engine as other modes.
3. Voice Chat Mode: v1.0 supports provider-safe transcript mode. Live realtime voice sessions require configured providers.
4. Traditional Form Mode: visitors submit structured callback, meeting, message, lead, partnership, or support requests.

## Shared Workflow

All modes feed the shared n8n-style workflow:

Trigger -> Identify executive/card -> Identify caller/visitor -> Detect language -> Consent disclosure -> Intent classification -> Urgency and trust scoring -> Action selection -> Event ledger write -> Contact graph update -> Notification preparation -> Follow-up task visibility.

## Provider Status

Provider dispatch is safety-gated. If telephony, realtime voice, calendar, or outbound email providers are not configured, the workflow queues internal requests and keeps them visible for human-approved follow-up.

## Active in v1.0

- Shared workflow engine sources for form, callback, calendar, inbound-call, chat, and voice-chat transcript mode.
- Request validation and safe queued mode.
- Event ledger persistence through the existing card event path.
- Dashboard visibility through receptionist request records.
- Human-approval-safe provider status.

## Future Provider Work

Live call answering, realtime AI voice, direct calendar booking, SMS, and outbound email dispatch require production provider credentials, consent rules, and owner validation before activation.
