# Rollback Plan

## Application Rollback

Use a known good Git ref:

```powershell
pwsh infrastructure/hostinger-vps/ROLLBACK.ps1 -GitRef <commit-or-tag>
```

The rollback script stops containers, checks out the requested ref, rebuilds,
and restarts services.

## Database Rollback

The project does not auto-run destructive database rollback. Use backups and
manual restore only after review.

## Before Rollback

- Capture logs.
- Take a fresh database backup.
- Record the current Git ref.
- Confirm the target Git ref.
- Notify stakeholders before traffic changes.

