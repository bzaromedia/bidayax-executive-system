param(
  [Parameter(Mandatory = $true)]
  [string]$GitSha,
  [string]$ReleaseRoot = "/opt/the-executive-card/releases",
  [string]$CurrentLink = "/opt/the-executive-card/current",
  [string]$ServiceName = "the-executive-card.service",
  [switch]$Execute,
  [switch]$ConfirmRollback
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$targetRelease = Join-Path $ReleaseRoot $GitSha

if (-not (Test-Path -LiteralPath $targetRelease)) {
  Write-Error "Requested release does not exist: $targetRelease"
}

Write-Warning "Rollback may require a database restore if schema or data changed after the target release."
Write-Host "Target immutable release: $targetRelease"
Write-Host "Current symlink path: $CurrentLink"
Write-Host "Service wrapper: $ServiceName"

if (-not $Execute) {
  Write-Host "Planning only. Re-run with -Execute -ConfirmRollback to switch the current release symlink and restart the wrapper service."
  return
}

if (-not $ConfirmRollback) {
  Write-Error "Rollback is blocked. Re-run with -ConfirmRollback after taking a fresh backup and confirming the database rollback plan."
}

if (-not (Get-Command ln -ErrorAction SilentlyContinue)) {
  Write-Error "ln is required to update the current release symlink atomically."
}

Write-Host "Switching current release symlink..."
& ln -sfn $targetRelease $CurrentLink

Write-Host "Restarting systemd wrapper..."
& systemctl restart $ServiceName
& systemctl status $ServiceName --no-pager
