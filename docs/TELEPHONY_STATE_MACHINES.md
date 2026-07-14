# Telephony State Machines

Call lifecycle:

requested -> queued -> dialing -> ringing -> answered -> in_conversation -> completed

Additional allowed branches include transferred, held, resumed, failed, busy, no_answer, voicemail, and cancelled. Terminal states do not transition back to active states.

Callback lifecycle:

requested -> scheduled -> assigned -> attempting -> completed

Failed callbacks may be rescheduled or cancelled. Completed and cancelled callbacks are terminal.

Appointment lifecycle:

requested -> pending -> confirmed -> completed

Cancelled and completed appointments are terminal.

Voicemail lifecycle:

received -> stored -> processed -> archived

The implementation lives in `services/telephony/src/domain-state-machines.ts` and rejects impossible transitions.

## Phase 6G Guarantees

State transitions now produce auditable transition evidence containing reason, timestamp, expected version, next version, correlation ID, and optional causation ID. Stale expected-version command writes fail in the control-plane safety layer.
