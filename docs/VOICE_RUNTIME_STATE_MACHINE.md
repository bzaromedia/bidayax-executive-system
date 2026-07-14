# Voice Runtime State Machine

## States

```text
initialized
greeting
listening
processing
waiting_for_tool
responding
escalating
completed
blocked
failed
```

## Text Or Voice Happy Path

```text
initialized -> greeting -> listening -> processing -> waiting_for_tool -> responding -> completed
```

## Sensitive Or Emergency Path

```text
initialized -> greeting -> listening -> processing -> escalating
```

## Prompt-Injection Path

```text
initialized -> greeting -> listening -> processing -> blocked
```

## Rules

- `completed`, `blocked`, and `failed` are terminal states.
- Impossible transitions throw errors.
- Sensitive and emergency language cannot execute tools directly.
- Prompt-injection attempts are blocked before tool planning.