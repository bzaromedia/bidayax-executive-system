param(
  [Parameter(Mandatory = $true)]
  [string]$CanonicalSha,
  [string]$ComposeProject = "the-executive-card"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[ordered]@{
  canonicalSha = $CanonicalSha
  composeProject = $ComposeProject
  validationSteps = @(
    "Validate card loopback route /card/ad-garner",
    "Validate dashboard loopback /api/system/health",
    "Validate dashboard loopback /api/system/readiness",
    "Validate WorkOS callback route behavior",
    "Validate WorkOS webhook route behavior",
    "Compare unrelated workload fingerprints",
    "Record structured evidence before release promotion"
  )
} | ConvertTo-Json -Depth 5
