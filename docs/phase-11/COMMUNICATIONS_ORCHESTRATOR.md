# Communications Orchestrator

## Role

The Communications Orchestrator is the sole coordination authority for communication execution.

## Responsibilities

- validate identity and scope
- evaluate consent
- evaluate suppressions
- evaluate business hours
- evaluate fraud policy
- evaluate kill switches
- select an eligible channel
- select an eligible adapter
- persist lifecycle state
- enqueue dispatch work
- process normalized adapter events
- classify retries and terminal failures
- emit audit events
- emit safe trust evidence

## Non-Goals

The orchestrator does not:

- embed provider SDK logic
- trust caller ID as identity
- bypass receptionist policy
- bypass suppressions or consent
- activate production execution
