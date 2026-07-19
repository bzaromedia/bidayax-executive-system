Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$GitSha,
  [switch]$Execute,
  [switch]$RunMigrateVerification,
  [switch]$ConfirmActivation
)

Write-Warning "DEPLOY.ps1 now delegates to the immutable release workflow."
& (Join-Path $PSScriptRoot "DEPLOY-RELEASE.ps1") `
  -GitSha $GitSha `
  -Execute:$Execute `
  -RunMigrateVerification:$RunMigrateVerification `
  -ConfirmActivation:$ConfirmActivation
