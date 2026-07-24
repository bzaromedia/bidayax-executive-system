param(
  [Parameter(Mandatory = $true)]
  [string]$GitSha,
  [Parameter(Mandatory = $true)]
  [string]$TargetHost,
  [Parameter(Mandatory = $true)]
  [string]$ComposeProject,
  [Parameter(Mandatory = $true)]
  [string]$OperatorAuthorizationReference,
  [string]$ReleaseRoot = "/opt/the-executive-card/releases",
  [string]$CurrentLink = "/opt/the-executive-card/current",
  [string]$SharedRoot = "/opt/the-executive-card/shared"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[ordered]@{
  gitSha = $GitSha
  targetHost = $TargetHost
  composeProject = $ComposeProject
  operatorAuthorizationReference = $OperatorAuthorizationReference
  releaseRoot = $ReleaseRoot
  currentLink = $CurrentLink
  sharedRoot = $SharedRoot
  steps = @(
    "Create immutable release directory under /opt/the-executive-card/releases/<git-sha>",
    "Materialize canonical source into the release directory",
    "Validate compose config with the external environment file",
    "Validate card and dashboard images before pointer promotion",
    "Switch /opt/the-executive-card/current only after all verification passes"
  )
  blockedActions = @(
    "Do not move the existing live env until explicitly approved",
    "Do not create another permanent compose project",
    "Do not modify the PostgreSQL volume"
  )
} | ConvertTo-Json -Depth 5
