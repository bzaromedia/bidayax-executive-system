# Restore Rehearsal Plan

Project: The Executive Card™
Database target: PostgreSQL 17
Execution scope: non-production only

## Prohibitions

- Do not test restore on the production database.
- Do not reuse a live production container as the restore target.
- Do not skip checksum verification.

## Roles

- application role: runtime database access only
- migration role: approved schema changes only
- backup role: optional read-only dump role when provisioned

The separate migration and backup credentials may be provisioned later. Until then, document the intended role split and avoid reusing a single over-privileged credential when a safer option is available.

## Rehearsal Sequence

1. create a fresh backup with `scripts/backup-database.ps1`
2. record backup path, git SHA, and timestamp
3. generate and record a checksum for the backup artifact
4. verify the checksum before restore
5. create a disposable PostgreSQL 17 target
6. restore the backup into the disposable target
7. verify migration inventory with `pnpm db:migrations:verify`
8. verify schema objects and expected tables
9. verify triggers and append-only protections
10. verify tenant-isolation invariants
11. verify trust-layer tables and constraints
12. verify card connectivity against the restored target
13. verify dashboard connectivity against the restored target
14. record elapsed duration, errors, and operator notes
15. destroy the disposable target after evidence capture

## Required Verification Points

- migration inventory matches repository expectations
- expected tables exist
- trust-layer tables exist and remain internally consistent
- append-only constraints remain effective where the schema requires them
- application database connection succeeds
- dashboard readiness can reach the restored database

## Evidence To Record

- backup filename
- checksum
- restore start time
- restore completion time
- total elapsed time
- migration verifier result
- schema verification notes
- trigger verification notes
- tenant-isolation verification notes
- trust-table verification notes
- cleanup completion

## Recovery Targets

- target RPO: 24 hours baseline, tighter before planned deployments
- target RTO: 60 to 120 minutes depending on restore size and follow-up verification
