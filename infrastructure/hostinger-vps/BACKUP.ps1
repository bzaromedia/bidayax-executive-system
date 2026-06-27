param(
  [string]$OutputPath = "backups\bidayax-vps-$(Get-Date -Format yyyyMMdd-HHmmss).dump"
)

$ErrorActionPreference = "Stop"

pwsh scripts/backup-database.ps1 -OutputPath $OutputPath

