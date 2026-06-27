param(
  [Parameter(Mandatory = $true)]
  [string]$GitRef,
  [string]$ComposeFile = "infrastructure/docker/docker-compose.production.yml"
)

$ErrorActionPreference = "Stop"

Write-Warning "Rollback changes application code. Take a database backup first."
Write-Host "Target Git ref: $GitRef"
Write-Host "Stopping containers..."
docker compose -f $ComposeFile down

Write-Host "Checking out requested ref..."
git fetch --all --prune
git checkout $GitRef

Write-Host "Rebuilding and starting containers..."
docker compose -f $ComposeFile build
docker compose -f $ComposeFile up -d
docker compose -f $ComposeFile ps

