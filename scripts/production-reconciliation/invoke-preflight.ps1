param(
  [Parameter(Mandatory = $true)]
  [string]$CanonicalSha,
  [string]$ExpectedComposeProject = "the-executive-card",
  [string]$ExpectedCardBinding = "127.0.0.1:3100:3000",
  [string]$ExpectedDashboardBinding = "127.0.0.1:3101:3001",
  [switch]$EmitRemotePlan
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$currentBranch = (& git branch --show-current).Trim()
$currentHead = (& git rev-parse HEAD).Trim()
$originMain = (& git rev-parse origin/main).Trim()
$status = (& git status --short).Trim()

if ($currentBranch -ne "main" -and $currentBranch -ne "ops/executive-card-production-reconciliation") {
  throw "Unexpected working branch: $currentBranch"
}

if ($currentHead -ne $CanonicalSha) {
  throw "Current HEAD $currentHead does not match approved canonical SHA $CanonicalSha"
}

if ($originMain -ne $CanonicalSha) {
  throw "origin/main $originMain does not match approved canonical SHA $CanonicalSha"
}

if ($status.Length -gt 0) {
  throw "Working tree is not clean."
}

$result = [ordered]@{
  canonicalSha = $CanonicalSha
  currentBranch = $currentBranch
  currentHead = $currentHead
  expectedComposeProject = $ExpectedComposeProject
  expectedCardBinding = $ExpectedCardBinding
  expectedDashboardBinding = $ExpectedDashboardBinding
  remoteExecutionPlanningOnly = $EmitRemotePlan.IsPresent
}

if ($EmitRemotePlan) {
  $result["remotePlan"] = @(
    "ssh hostinger-executive-card",
    "docker compose --project-name the-executive-card --file /opt/the-executive-card/repo/infrastructure/docker/docker-compose.hostinger.yml config"
  )
}

$result | ConvertTo-Json -Depth 5
