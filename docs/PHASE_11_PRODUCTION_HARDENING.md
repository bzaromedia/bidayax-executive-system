# Phase 11 — Production Hardening

Historical status: completed v1.0 hardening tranche.

This document is not the closure record for the active Phase 11 Communications
Completion roadmap. Active Phase 11 governance lives in
`docs/phase-11/PHASE_11_MASTER_PLAN.md` and
`docs/governance/CURRENT_PHASE_STATUS.md`.

This distinction does not reopen or invalidate this completed historical
hardening tranche.

Phase 11 makes the current system safer to deploy, operate, inspect, back up,
and roll back.

## Acceptance Mapping

| Requirement | Status |
| --- | --- |
| Central env validation | Complete |
| `.env.example` | Complete |
| `.env.production.example` | Complete |
| Security baseline | Complete |
| Health endpoint | Complete |
| Readiness endpoint | Complete |
| Migration verification | Complete |
| Database check script | Complete |
| Backup script | Complete |
| Restore script | Complete |
| Production readiness script | Complete |
| Root verify scripts | Complete |
| Structured logger | Complete |
| Safe error helpers | Complete |
| Docker production config | Complete |
| Caddy config | Complete |
| Hostinger VPS guide | Complete |
| PowerShell deployment scripts | Complete |
| Dashboard warnings | Complete |
| No new product features | Complete |
| Unsafe voice behavior remains disabled | Complete |

## Validation Questions

1. Can a new engineer run the project safely?
   Yes. Environment examples, root verification scripts, and runbooks are now
   present.

2. Can production readiness be checked objectively?
   Yes. `pnpm verify:production`, `/api/system/health`, and
   `/api/system/readiness` report structured status.

3. Are secrets protected?
   Yes. Config checks only validate presence and logger helpers redact sensitive
   keys.

4. Are unsafe voice features still blocked by default?
   Yes. Existing Phase 10 voice gates remain disabled by default.

5. Are migrations verifiable?
   Yes. `scripts/verify-migrations.ts` checks ordering and naming.

6. Can the database be backed up?
   Yes. `scripts/backup-database.ps1` wraps `pg_dump`.

7. Can deployment be rolled back?
   Yes. The Hostinger rollback script documents a Git-ref rollback flow.

8. Does the dashboard show truthful production state?
   Yes. It shows production hardening warnings for mock provider, missing DB,
   disabled calls, test mode, and missing provider config.

9. Is Hostinger VPS deployment documented?
   Yes. See `infrastructure/hostinger-vps/DEPLOYMENT_GUIDE.md`.

10. Did we avoid adding new product features?
    Yes. Phase 11 only adds hardening, operations, and verification.
