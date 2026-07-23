param(
  [Parameter(Mandatory = $true)]
  [string]$EnvironmentFilePath,
  [string]$OutputPath = "artifacts/production-reconciliation/environment-contract.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$absoluteOutput = Join-Path $repoRoot $OutputPath
$outputDirectory = Split-Path -Parent $absoluteOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

& node --experimental-strip-types (Join-Path $repoRoot "packages/database-reconciliation/src/cli/env-contract.ts") $EnvironmentFilePath |
  Set-Content -LiteralPath $absoluteOutput -NoNewline

Write-Host "Environment contract report written to $absoluteOutput"
