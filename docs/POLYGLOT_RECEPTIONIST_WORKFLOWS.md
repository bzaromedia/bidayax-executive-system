# Polyglot Receptionist Workflows

The Polyglot Receptionist workflow is implemented as an n8n-style typed workflow foundation inside `services/polyglot-receptionist`. It coordinates card-submitted requests and provider-safe inbound call workflows without requiring live provider credentials.

## Master Workflow

```text
Incoming Call or Card Request
-> Identify Executive
-> Caller Lookup
-> Language and Dialect Detection
-> Consent and Safety Check
-> Greeting/Request Context
-> Intent Classification
-> Urgency and Voice Trust Scoring
-> Availability Policy Decision
-> Route to Workflow
-> Event Ledger Write
-> Contact Graph Update
-> Notification Payload
-> Dashboard Visibility
-> Audit Log
```

## Workflow Routes

### Book Meeting

A request routes to meeting booking when the transcript or request type indicates scheduling, calendar, meeting, or appointment intent. If calendar credentials are not configured, the workflow creates an internal queued request.

### Take Message

A request routes to message capture when no higher-confidence action is available. Message capture records the sanitized message, language profile, summary, and dashboard audit timeline.

### Request Callback

A request routes to callback when the caller asks for a return call. Callback priority is scored from caller intent, trust score, urgency, and existing-client context.

### Qualify Lead

Sales, investor, and enterprise buying language can route to lead qualification. The workflow extracts company context when supplied and marks high-value requests for human-approved follow-up.

### Transfer Call

Live transfer is provider-gated and disabled by default. The availability policy only permits transfer when transfer is enabled and caller trust is high. Sensitive transfers still require human approval.

### Escalate Emergency

Emergency and sensitive intents are escalated to human review. The workflow must not make promises or provide legal, medical, financial, or operational commitments.

### Block Spam

Spam, prompt attack, malformed phone, burst activity, or unsafe transcript patterns can block the workflow with `blocked_by_policy`.

## Algorithms

- `routePolyglotCallIntent`: classifies sales, investor, customer, partner, vendor, media, legal, emergency, personal, spam, or unknown intent.
- `decideExecutiveAvailability`: chooses transfer, meeting, callback, lead qualification, message capture, human approval, or spam block.
- `calculateVoiceTrustScore`: scores caller trust from identity, company context, history, language confidence, sensitive intent, sentiment, and spam risk.
- `calculateCallbackPriorityScore`: ranks callback priority from intent value, trust, urgency, and existing-client context.
- `createMultilingualConversationMemory`: stores original transcript, English executive summary, action items, intent, and confidence.
- `classifySpamAndAbuseRisk`: detects prompt injection, spam terms, malformed caller information, and repeated request bursts.
- `decideReceptionistEscalation`: enforces human approval for sensitive or high-urgency actions.

## Provider Interfaces

The provider-safe interfaces are defined in `services/polyglot-receptionist/src/provider-interfaces.ts`:

- `VoiceTelephonyProvider`
- `SpeechToTextProvider`
- `RealtimeVoiceAgentProvider`
- `TextToSpeechProvider`
- `TranslationProvider`

These interfaces allow future Twilio, OpenAI Realtime, Deepgram, ElevenLabs, or other provider adapters without hardcoding provider behavior into the workflow engine.

## Environment Variables

Provider dispatch depends on environment configuration and safety flags:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY`
- `DEFAULT_RECEPTIONIST_LANGUAGE`
- `VOICE_RECORDING_DISCLOSURE_ENABLED`
- `CALL_TRANSFER_ENABLED`
- `HUMAN_APPROVAL_REQUIRED`

No secret values belong in source control.

## Dashboard Surface

The receptionist console is the existing dashboard route at `/receptionist`. It shows recent requests, request ID, executive, requester, company, language, request type, urgency, voice trust score, callback state, meeting state, provider status, and audit timeline.

## Acceptance Evidence

The call workflow is covered by `services/polyglot-receptionist/tests/call-workflow.test.ts`, including simulated inbound calls, language routing, meeting and callback workflows, spam blocking, consent validation, human approval, trust scoring, multilingual summary, and dashboard data shape.
