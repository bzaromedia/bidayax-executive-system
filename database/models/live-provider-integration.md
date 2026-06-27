# Live Provider Integration Model

Phase 10 adds safety-gated provider readiness records without storing secrets,
raw audio, recordings, payment data, raw IP addresses, or identity-enrichment
data.

## provider_readiness_checks

Stores point-in-time readiness results for mock, Twilio, and OpenAI Realtime
checks.

- `provider`: `mock`, `twilio`, or `openai_realtime`
- `check_name`: deterministic check identifier
- `status`: `passed`, `failed`, `warning`, or `skipped`
- `details`: human-readable non-secret explanation
- `checked_at`: time the readiness check was evaluated

## voice_runtime_sessions

Stores future voice runtime readiness state. It does not start live audio
streams and does not create OpenAI Realtime sessions in Phase 10.

- `provider`: `none` or `openai_realtime`
- `runtime_model`: configured realtime model name, never an API key
- `status`: readiness/session state
- `test_mode`: whether the runtime remains test-only
- `safety_gate_status`: production gate result
- `transcript_status`: placeholder transcript state
- `summary_status`: placeholder summary state

## Safety Defaults

- `TELEPHONY_PROVIDER=mock`
- `VOICE_AGENT_ENABLED=false`
- `VOICE_TEST_MODE=true`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `REQUIRE_HUMAN_APPROVAL=true`
- `ALLOW_PRODUCTION_CALLS=false`

