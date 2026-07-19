# Communications Domain Events

## Version

Current event version: `1`

## Required Events

- `communication.requested`
- `communication.policy_checked`
- `communication.authorized`
- `communication.blocked`
- `communication.queued`
- `communication.dispatched`
- `communication.accepted`
- `communication.active`
- `communication.completed`
- `communication.failed`
- `communication.cancelled`
- `communication.escalated`
- `communication.suppressed`
- `communication.kill_switch_applied`
- `communication.adapter_degraded`
- `communication.adapter_recovered`

## Event Rules

- tenant-scoped
- card-scoped when applicable
- immutable once written
- safe for trust-evidence linkage
- free of raw transcript, raw audio, and secret material
