# Voice Runtime State Machine

## States

```text
idle
listening
transcribing
understanding
planning
responding
completed
escalated
blocked
failed
```

## Happy Path

Voice input:

```text
idle -> listening -> transcribing -> understanding -> planning -> responding -> completed
```

Text input:

```text
idle -> listening -> understanding -> planning -> responding -> completed
```

Sensitive request:

```text
idle -> listening -> understanding -> planning -> escalated
```

## Rules

Terminal states cannot transition forward. Impossible transitions throw errors in tests and runtime code.