# Receptionist Workflows

The Executive Card uses a shared receptionist workflow model so phone calls, text chat, voice-chat transcript mode, and traditional forms create the same structured front-office intelligence.

## Nodes

- InboundCallTrigger
- ChatMessageTrigger
- VoiceChatTrigger
- FormSubmitTrigger
- ExecutiveLookup
- CallerLookup
- LanguageDetection
- ConsentDisclosure
- IntentClassification
- UrgencyScoring
- VoiceTrustScoring
- AvailabilityPolicy
- CalendarLookup
- CallbackScheduler
- AppointmentScheduler
- MessageCapture
- LeadQualification
- CallTransfer
- SpamFilter
- HumanApproval
- EventLedgerWrite
- ContactGraphUpdate
- NotificationSend
- ReceptionistSummary

## Mode Behavior

Phone Call Mode normalizes provider webhook payloads into callback-oriented requests. Text Chat Mode posts a visitor message to the receptionist workflow. Voice Chat Mode queues transcript-mode requests until realtime providers are configured. Form Mode collects structured data and creates callback, meeting, message, lead, partnership, or support tasks.

## Safety Rules

The receptionist must not approve contracts, accept payments, make legal/medical/financial claims, disclose private executive information, bypass human approval, or pretend to be a human. Sensitive cases are escalated for human review.

## Owner Setup Required for Live Providers

- Telephony: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, or a future Telnyx/SIP adapter.
- Realtime voice: `OPENAI_API_KEY` and/or `ELEVENLABS_API_KEY`.
- Transcription: `DEEPGRAM_API_KEY` or an approved speech-to-text provider.
- Calendar: Google Calendar or Microsoft Graph credentials.
- Notifications: outbound email/SMS provider credentials.
