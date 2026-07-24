param(
  [Parameter(Mandatory = $true)]
  [string]$ComposeFilePath,
  [Parameter(Mandatory = $true)]
  [string]$ActualProjectName,
  [string]$OutputPath = "artifacts/production-reconciliation/compose-safety.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$absoluteOutput = Join-Path $repoRoot $OutputPath
$outputDirectory = Split-Path -Parent $absoluteOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$report = & node --experimental-strip-types (Join-Path $repoRoot "packages/database-reconciliation/src/cli/compose-safety.ts") $ComposeFilePath $ActualProjectName
if ($LASTEXITCODE -ne 0) {
  throw "Compose safety check failed with exit code $LASTEXITCODE."
}

$report | Set-Content -LiteralPath $absoluteOutput -NoNewline

Write-Host "Compose safety report written to $absoluteOutput for project $ActualProjectName"
