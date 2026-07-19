# Communications Data Model Plan

## Principle

Phase 11 must extend the existing communications-related storage foundation rather than create a parallel overlapping domain.

## Reuse / Extend / Add

- Extend `telephony_phone_numbers` for communications-owned number ownership metadata
- Extend `telephony_callback_requests` for communications callback orchestration
- Extend `telephony_call_sessions` for channel-neutral lifecycle linkage
- Extend `telephony_call_recordings` and `telephony_call_transcripts` for policy-owned metadata only
- Extend `telephony_consent_policies` for communications consent policy ownership
- Extend `telephony_audit_events` for communications audit coverage
- Add participants, state transitions, attempts, suppressions, business-hours policies, webhook evidence, summaries, provider health, and failover evidence

## Storage Rules

- all rows tenant-scoped
- composite card FKs where applicable
- immutable audit and lifecycle evidence
- durable idempotency keys
- no provider secrets in application tables
- no raw transcript or raw audio in trust evidence
