# Telephony Integration Preparation Model

Phase 9 prepares The Executive Card for live voice and telephony integration without enabling uncontrolled production calling.

## Tables

### telephony_calls

Stores high-level call records from mock or future live providers.

### telephony_call_events

Stores call lifecycle events such as received, validated, completed, failed, blocked, and approval events.

### voice_sessions

Stores future voice-agent session metadata. Phase 9 does not stream audio or connect OpenAI Realtime.

### outbound_call_requests

Stores outbound call requests before any provider execution is allowed. Human approval is required by default and outbound calls are disabled by default.

## Safety Rules

The default provider is `mock`, outbound calling is disabled, voice agent execution is disabled, and human approval is required. No raw audio, recordings, payment data, or external enrichment is stored.
