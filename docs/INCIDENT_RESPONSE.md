# Incident Response

## Severity Examples

- Critical: production data unavailable, secret exposure, unsafe voice gate
  behavior.
- High: dashboard unavailable, event ingestion failing, readiness not ready.
- Medium: degraded provider readiness, delayed logs, backup warning.

## First Steps

1. Stop unsafe traffic if needed.
2. Capture logs.
3. Check `/api/system/health`.
4. Check `/api/system/readiness`.
5. Verify recent deploy ref.
6. Take a database backup before rollback or restore.

## Do Not

- Do not print secrets.
- Do not run destructive restore without confirmation.
- Do not enable production voice flags during incident triage.
- Do not claim customer or lead identity from anonymous signals.

