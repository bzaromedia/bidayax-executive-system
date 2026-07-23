param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("card", "dashboard")]
  [string]$Kind,
  [Parameter(Mandatory = $true)]
  [string]$SourceImageId,
  [string]$OutputPath = "artifacts/production-reconciliation/image-preservation-plan.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$absoluteOutput = Join-Path $repoRoot $OutputPath
$outputDirectory = Split-Path -Parent $absoluteOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

& node --experimental-strip-types (Join-Path $repoRoot "packages/database-reconciliation/src/cli/image-preservation.ts") $Kind $SourceImageId |
  Set-Content -LiteralPath $absoluteOutput -NoNewline

Write-Host "Image preservation plan written to $absoluteOutput"
