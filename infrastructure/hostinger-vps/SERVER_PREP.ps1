Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Checking dedicated VPS prerequisites for The Executive Card..."

$commands = @("caddy", "docker", "git", "node", "pnpm", "pwsh")

foreach ($command in $commands) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    Write-Warning "$command is not installed or not on PATH."
  } else {
    Write-Host "$command found."
  }
}

$requiredPaths = @(
  "/opt/the-executive-card/releases",
  "/opt/the-executive-card/shared",
  "/opt/the-executive-card/shared/env",
  "/opt/the-executive-card/shared/logs",
  "/opt/the-executive-card/shared/backups",
  "/opt/the-executive-card/infrastructure"
)

foreach ($path in $requiredPaths) {
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Warning "$path does not exist yet."
  } else {
    Write-Host "$path found."
  }
}

$environmentFile = "/opt/the-executive-card/shared/env/production.env"
if (Test-Path -LiteralPath $environmentFile) {
  Write-Host "External production environment file found."
} else {
  Write-Warning "External production environment file not found at $environmentFile."
}

Write-Host "Ensure only ports 22, 80, and 443 are publicly reachable."
Write-Host "No secrets were read or printed."
