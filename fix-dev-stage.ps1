# Quick fix for dev/stage environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Dev/Stage Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop all services
Write-Host "Stopping all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>$null
docker-compose down 2>$null

# Check certificates
if (-not (Test-Path "certs\localhost.pem")) {
    Write-Host "SSL certificates not found. Generating..." -ForegroundColor Yellow
    if (Test-Path "setup-https-docker.ps1") {
        .\setup-https-docker.ps1
    } else {
        Write-Host "Error: setup-https-docker.ps1 not found" -ForegroundColor Red
        Write-Host "Please run: mkcert -install" -ForegroundColor Yellow
        Write-Host "Then: cd certs && mkcert localhost 127.0.0.1 ::1 192.168.8.199 0.0.0.0" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "SSL certificates found" -ForegroundColor Green
}

# Ensure network exists
Write-Host ""
Write-Host "Checking Docker network..." -ForegroundColor Yellow
$networkExists = docker network inspect intership-network 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating intership-network..." -ForegroundColor Yellow
    docker network create intership-network
} else {
    Write-Host "Network exists" -ForegroundColor Green
}

# Start production services first (for MongoDB)
Write-Host ""
Write-Host "Starting production MongoDB..." -ForegroundColor Yellow
docker-compose up -d mongodb

# Wait for MongoDB to be healthy
Write-Host "Waiting for MongoDB to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if MongoDB is running
$mongoStatus = docker ps --filter "name=intership-mongodb" --format "{{.Status}}"
if ($mongoStatus) {
    Write-Host "MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "MongoDB failed to start" -ForegroundColor Red
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker-compose logs mongodb
    exit 1
}

# Start dev services
Write-Host ""
Write-Host "Starting dev services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Wait for services
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check status
Write-Host ""
Write-Host "Service status:" -ForegroundColor Cyan
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "Testing endpoints..." -ForegroundColor Cyan

# Test backend (with certificate validation bypass for self-signed certs)
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $response = Invoke-WebRequest -Uri "https://192.168.8.199:9446/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend is accessible at https://192.168.8.199:9446" -ForegroundColor Green
} catch {
    Write-Host "Backend is not accessible at https://192.168.8.199:9446" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Yellow
}

# Test frontend
try {
    $response = Invoke-WebRequest -Uri "https://192.168.8.199:9445" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Frontend is accessible at https://192.168.8.199:9445" -ForegroundColor Green
} catch {
    Write-Host "Frontend is not accessible at https://192.168.8.199:9445" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "If services are not accessible:" -ForegroundColor Yellow
Write-Host "1. Check logs: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs" -ForegroundColor White
Write-Host "2. Check ports: netstat -ano | findstr 9445 9446" -ForegroundColor White
Write-Host "3. Verify Cloudflare routes point to correct ports" -ForegroundColor White
Write-Host ""
