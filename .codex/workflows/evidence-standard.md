# Evidence Standard

Every meaningful task report must include:

- repository starting state
- governing requirements consulted
- files changed
- exact commands run in sanitized form when needed
- result per command
- unresolved issues
- final Git state

Allowed status values:

- `PASSED`
- `FAILED`
- `NOT RUN`
- `NOT APPLICABLE`
- `BLOCKED`

Rules:

- never claim a pass without running the check
- distinguish focused validation from full-suite validation
- record when evidence comes from CI, local runs, or both
- if a failure is pre-existing, provide proof
- redact secrets, tokens, connection strings, signed URLs, and sensitive arguments as `[REDACTED]`
- do not include raw sensitive output in durable evidence