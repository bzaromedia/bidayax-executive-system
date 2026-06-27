# Backup And Restore

## Backup

```powershell
pwsh scripts/backup-database.ps1
```

The script requires `DATABASE_URL` and uses `pg_dump`.

## Restore

```powershell
pwsh scripts/restore-database.ps1 -BackupPath backups\file.dump -ConfirmRestore
```

Restore is intentionally gated by `-ConfirmRestore` because it can replace data.

## Rules

- Do not print `DATABASE_URL`.
- Take a fresh backup before rollback.
- Store production backups outside the repo.
- Test restore in a non-production environment before relying on it.

