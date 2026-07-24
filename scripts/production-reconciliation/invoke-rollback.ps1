param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("application", "proxy", "database")]
  [string]$RollbackLevel,
  [Parameter(Mandatory = $true)]
  [string]$TargetHost,
  [Parameter(Mandatory = $true)]
  [string]$ComposeProject,
  [Parameter(Mandatory = $true)]
  [string]$OperatorAuthorizationReference
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$plans = @{
  application = @(
    "Restore exact prior card image",
    "Restore exact prior dashboard image",
    "Restore prior compose artifact if required",
    "Restore prior environment artifact if required",
    "Do not touch PostgreSQL without separate approval"
  )
  proxy = @(
    "Restore previous Executive Card Nginx site artifact",
    "Run nginx -t",
    "Reload Nginx only if validation passes"
  )
  database = @(
    "Blocked until explicit typed confirmation",
    "Require verified dump path and exact database identity",
    "Require post-restore integrity validation"
  )
}

[ordered]@{
  rollbackLevel = $RollbackLevel
  targetHost = $TargetHost
  composeProject = $ComposeProject
  operatorAuthorizationReference = $OperatorAuthorizationReference
  steps = $plans[$RollbackLevel]
} | ConvertTo-Json -Depth 4
