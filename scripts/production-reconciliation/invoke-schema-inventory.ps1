param(
  [Parameter(Mandatory = $true)]
  [string]$TargetHost,
  [Parameter(Mandatory = $true)]
  [string]$ComposeProject,
  [string]$OutputPath = "artifacts/production-reconciliation/schema-inventory.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$absoluteOutput = Join-Path $repoRoot $OutputPath
$outputDirectory = Split-Path -Parent $absoluteOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL must be supplied through the process environment, not a command argument."
}

$report = & node --experimental-strip-types (Join-Path $repoRoot "packages/database-reconciliation/src/cli/schema-inventory.ts")
if ($LASTEXITCODE -ne 0) {
  throw "Schema inventory failed with exit code $LASTEXITCODE."
}

$report | Set-Content -LiteralPath $absoluteOutput -NoNewline

Write-Host "Schema inventory written to $absoluteOutput for $TargetHost / $ComposeProject"
