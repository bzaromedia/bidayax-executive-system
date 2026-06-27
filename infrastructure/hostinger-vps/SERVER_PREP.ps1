$ErrorActionPreference = "Stop"

Write-Host "Checking Hostinger VPS prerequisites..."

$commands = @("docker", "git", "node", "pnpm")

foreach ($command in $commands) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    Write-Warning "$command is not installed or not on PATH."
  } else {
    Write-Host "$command found."
  }
}

Write-Host "Ensure ports 80 and 443 are open and DNS is pointed at this VPS."
Write-Host "No secrets were read or printed."

