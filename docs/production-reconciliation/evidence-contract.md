# Evidence Contract

Every operator action must emit:

- operation ID
- UTC timestamp
- canonical SHA
- target host
- target compose project
- target service
- precondition result
- action result
- verification result
- rollback readiness
- unrelated workload result
- secret-redaction result
- operator authorization reference

Store:

- JSON evidence
- Markdown summary

Store no secrets.
