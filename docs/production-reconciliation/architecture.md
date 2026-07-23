# Architecture

The reconciliation package has four layers:

1. canonical migration manifests derived from repository migrations `0014`–`0017`
2. deterministic live schema inventory for PostgreSQL 17
3. reconciliation classification and operator decision support
4. guarded PowerShell operator entrypoints and runbooks

The package is provider-neutral. It compares evidence; it never executes a migration decision automatically.
