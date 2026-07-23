param(
  [Parameter(Mandatory = $true)]
  [string]$ConnectionString,
  [string]$OutputPath = "artifacts/production-reconciliation/schema-inventory.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$absoluteOutput = Join-Path $repoRoot $OutputPath
$outputDirectory = Split-Path -Parent $absoluteOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

& node --experimental-strip-types (Join-Path $repoRoot "packages/database-reconciliation/src/cli/schema-inventory.ts") $ConnectionString |
  Set-Content -LiteralPath $absoluteOutput -NoNewline

Write-Host "Schema inventory written to $absoluteOutput"
