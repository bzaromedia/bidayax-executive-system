param(
  [Parameter(Mandatory = $true)]
  [string]$GitSha,
  [string]$ReleaseRoot = "/opt/the-executive-card/releases",
  [string]$CurrentLink = "/opt/the-executive-card/current",
  [string]$SharedRoot = "/opt/the-executive-card/shared",
  [string]$ComposeRelativePath = "infrastructure/docker/docker-compose.hostinger.yml",
  [string]$EnvironmentFile = "/opt/the-executive-card/shared/env/production.env",
  [switch]$Execute,
  [switch]$RunMigrateVerification,
  [switch]$ConfirmActivation
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-AbsolutePath([string]$Path, [string]$Label) {
  if ([string]::IsNullOrWhiteSpace($Path)) {
    throw "$Label is required."
  }

  if (-not [System.IO.Path]::IsPathRooted($Path)) {
    throw "$Label must be an absolute path: $Path"
  }
}

Assert-AbsolutePath -Path $ReleaseRoot -Label "ReleaseRoot"
Assert-AbsolutePath -Path $CurrentLink -Label "CurrentLink"
Assert-AbsolutePath -Path $SharedRoot -Label "SharedRoot"
Assert-AbsolutePath -Path $EnvironmentFile -Label "EnvironmentFile"

$releasePath = Join-Path $ReleaseRoot $GitSha
$composeFile = Join-Path $releasePath $ComposeRelativePath
$metadataDirectory = Join-Path $releasePath ".release"
$metadataPath = Join-Path $metadataDirectory "metadata.json"

if (-not (Test-Path -LiteralPath $releasePath)) {
  Write-Error "Immutable release path does not exist: $releasePath"
}

if (-not (Test-Path -LiteralPath $composeFile)) {
  Write-Error "Compose file does not exist inside the release: $composeFile"
}

if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
  Write-Error "External environment file does not exist: $EnvironmentFile"
}

Write-Host "Release path: $releasePath"
Write-Host "Compose file: $composeFile"
Write-Host "Environment file: $EnvironmentFile"
Write-Host "Current symlink: $CurrentLink"

if (-not $Execute) {
  Write-Host "Planning only. Re-run with -Execute -ConfirmActivation to validate the release, optionally run migration verification, write metadata, and activate the current symlink."
  return
}

if (-not $ConfirmActivation) {
  Write-Error "Release activation is blocked. Re-run with -ConfirmActivation after taking a fresh backup and confirming the rollback plan."
}

Write-Host "Validating compose configuration..."
& docker compose --env-file $EnvironmentFile -f $composeFile config | Out-Null

if ($RunMigrateVerification) {
  Write-Host "Running one-shot migration verification profile..."
  & docker compose --env-file $EnvironmentFile -f $composeFile --profile migrate run --rm migrate
}

New-Item -ItemType Directory -Force -Path $metadataDirectory | Out-Null

$metadata = [ordered]@{
  gitSha = $GitSha
  activatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
  composeFile = $composeFile
  environmentFile = $EnvironmentFile
  notes = @(
    "Record image tags or digests after the build and publish workflow is approved.",
    "Record release checksums and backup evidence before routing public traffic."
  )
}

$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $metadataPath -NoNewline
Write-Host "Activating current release symlink..."
& ln -sfn $releasePath $CurrentLink
Write-Host "Release activation planning complete. Start or reload the systemd wrapper separately after operator review."
