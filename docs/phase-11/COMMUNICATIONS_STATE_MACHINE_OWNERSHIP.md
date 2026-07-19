# Communications State Machine Ownership

## Domain-Owned Lifecycle

Channel-neutral lifecycle:

```text
requested
-> policy_checking
-> authorized
-> queued
-> dispatching
-> accepted
-> active
-> completed
```

Exceptional or terminal states:

```text
blocked
cancelled
failed
expired
suppressed
terminated
```

## Ownership Rule

The Communications Domain owns the canonical lifecycle and transition authority.

Adapters may expose transport states such as:

- ringing
- busy
- no answer
- voicemail
- carrier rejected
- provider accepted

Those transport states must be normalized into the communications lifecycle before they affect product policy.

## Transition Rules

- terminal states do not re-enter active states
- retries are bounded and explicit
- compensation behavior is defined per failure class
- every accepted transition emits audit evidence
- idempotency is mandatory for command-side transitions
