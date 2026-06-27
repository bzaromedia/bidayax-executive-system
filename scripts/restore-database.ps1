param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is required. Restore was not started."
}

if (-not (Test-Path -LiteralPath $BackupPath)) {
  Write-Error "Backup file not found: $BackupPath"
}

if (-not $ConfirmRestore) {
  Write-Error "Restore is potentially destructive. Re-run with -ConfirmRestore after taking a fresh backup."
}

Write-Host "Restoring PostgreSQL backup from $BackupPath"
Write-Host "This script does not print DATABASE_URL."
pg_restore --clean --if-exists --no-owner --dbname "$env:DATABASE_URL" "$BackupPath"
Write-Host "Restore complete."

