param(
  [string]$ComposeFile = "infrastructure/docker/docker-compose.production.yml"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath ".env.production")) {
  Write-Error ".env.production is required. Create it from .env.production.example."
}

Write-Host "Running production verification..."
pnpm db:migrations:verify
pnpm verify:production

Write-Host "Building production containers..."
docker compose -f $ComposeFile build

Write-Host "Starting production containers..."
docker compose -f $ComposeFile up -d

Write-Host "Deployment started. Inspect logs before routing traffic."
docker compose -f $ComposeFile ps

