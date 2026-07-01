# Polyglot Receptionist OS

## Purpose

Polyglot Receptionist OS is the future receptionist operating layer for The Executive Card. It will eventually support inbound calls, outbound calls, multilingual conversation, email handling, scheduling requests, contact logging, escalation, executive summaries, and workflow automation.

Phase 8 implements only the safe foundation. It does not connect live calling, email, calendar, voice, or workflow providers.

## Foundation Model

Phase 8 defines:

- receptionist interactions.
- receptionist tasks.
- simulated conversation turns.
- workflow events.
- language and dialect metadata.
- deterministic intent categories.
- deterministic escalation recommendations.

## Intent Categories

- `general_inquiry`
- `schedule_meeting`
- `request_callback`
- `partnership_interest`
- `investor_interest`
- `vendor_inquiry`
- `support_request`
- `wrong_number`
- `spam_or_low_value`
- `urgent_executive_attention`
- `unknown`

## Language Profile

The language profile captures:

- language.
- dialect.
- confidence.
- script.
- direction.
- notes.

Phase 8 language metadata is simulated. Live fluency depends on future voice and language infrastructure.

## Escalation

Escalation is a recommendation only. Phase 8 does not contact an executive automatically.

Escalation is recommended when:

- the intent is investor interest.
- the intent is urgent executive attention.
- partnership interest is high priority.
- sentiment is negative and priority is high.
- a task requires executive approval.
- the interaction cannot be confidently classified.

## Explicit Non-Goals

Phase 8 does not build live phone calling, OpenAI Realtime sessions, Twilio integration, real email sending, real calendar booking, CRM, autonomous receptionist deployment, production phone routing, or external workflow automation.
