param(
  [string]$OutputPath = "backups\bidayax-$(Get-Date -Format yyyyMMdd-HHmmss).dump"
)

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is required. No backup was created."
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null

Write-Host "Creating PostgreSQL backup at $OutputPath"
Write-Host "This script does not print DATABASE_URL."
pg_dump --format=custom --no-owner --file "$OutputPath" "$env:DATABASE_URL"
Write-Host "Backup complete: $OutputPath"

