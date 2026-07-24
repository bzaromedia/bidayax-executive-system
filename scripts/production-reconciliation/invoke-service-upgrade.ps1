param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("card", "dashboard")]
  [string]$Service,
  [Parameter(Mandatory = $true)]
  [string]$GitSha,
  [Parameter(Mandatory = $true)]
  [string]$TargetHost,
  [Parameter(Mandatory = $true)]
  [string]$ComposeProject,
  [Parameter(Mandatory = $true)]
  [string]$ComposeFilePath,
  [Parameter(Mandatory = $true)]
  [string]$OperatorAuthorizationReference
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[ordered]@{
  service = $Service
  gitSha = $GitSha
  targetHost = $TargetHost
  composeProject = $ComposeProject
  composeFilePath = $ComposeFilePath
  operatorAuthorizationReference = $OperatorAuthorizationReference
  orderedSteps = @(
    "Verify live baseline has not changed",
    "Preserve rollback image tag for the service",
    "Verify backup checksum",
    "Run schema reconciliation and operator decision gate",
    "Render compose with explicit project and file scope",
    "Build canonical image for the target service",
    "Validate image without replacing production",
    "Replace only the target service",
    "Run loopback and public validation for the target service",
    "Stop before touching the next service unless validation passes"
  )
  prohibitedCommands = @(
    "docker compose down",
    "docker compose down -v",
    "docker system prune",
    "docker volume prune",
    "docker network prune",
    "systemctl restart docker"
  )
} | ConvertTo-Json -Depth 5
