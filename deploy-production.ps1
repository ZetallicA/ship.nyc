# PowerShell Production Deployment Script for VPS
# Usage: .\deploy-production.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OATH Logistics Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: git is not installed" -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
$dockerCompose = $null
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $dockerCompose = "docker-compose"
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerCompose = "docker compose"
} else {
    Write-Host "Error: docker-compose is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching latest changes from main branch..." -ForegroundColor Yellow
git fetch origin main

Write-Host "Checking out main branch..." -ForegroundColor Yellow
git checkout main

Write-Host "Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

Write-Host ""
Write-Host "Stopping existing services..." -ForegroundColor Yellow
& $dockerCompose down

Write-Host ""
Write-Host "Building new images..." -ForegroundColor Yellow
& $dockerCompose build --no-cache

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
& $dockerCompose up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Yellow
& $dockerCompose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services should be available at:" -ForegroundColor Cyan
Write-Host "  Frontend: https://mail.oathone.com" -ForegroundColor White
Write-Host "  Backend:  https://mailbackend.oathone.com/api" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  $dockerCompose logs -f" -ForegroundColor White
Write-Host ""

