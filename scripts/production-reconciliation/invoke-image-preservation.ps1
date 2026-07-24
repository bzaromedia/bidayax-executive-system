param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("card", "dashboard")]
  [string]$Kind,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedImageId,
  [Parameter(Mandatory = $true)]
  [string]$ObservedImageId,
  [Parameter(Mandatory = $true)]
  [string]$RollbackTag,
  [string]$ExistingTagImageId,
  [string]$OutputPath = "artifacts/production-reconciliation/image-preservation-plan.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$absoluteOutput = Join-Path $repoRoot $OutputPath
$outputDirectory = Split-Path -Parent $absoluteOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$arguments = @(
  $Kind,
  $ExpectedImageId,
  $ObservedImageId,
  $RollbackTag
)

if ($ExistingTagImageId) {
  $arguments += $ExistingTagImageId
}

$report = & node --experimental-strip-types (Join-Path $repoRoot "packages/database-reconciliation/src/cli/image-preservation.ts") @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Image preservation plan failed with exit code $LASTEXITCODE."
}

$report | Set-Content -LiteralPath $absoluteOutput -NoNewline

Write-Host "Image preservation plan written to $absoluteOutput"
