# PowerShell script to start Dev/Stage Environment with HTTPS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Dev/Stage Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if certificates exist
if (-not (Test-Path "certs\localhost.pem")) {
    Write-Host "WARNING: SSL certificates not found!" -ForegroundColor Yellow
    Write-Host "HTTPS will not work. Run setup-https-docker.ps1 first." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        exit
    }
}

# Check if production network exists
$networkExists = docker network inspect intership-network 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating intership-network..." -ForegroundColor Yellow
    docker network create intership-network
    Write-Host ""
}

# Start dev services
Write-Host "Starting dev services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Dev/Stage Environment Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend Dev: https://192.168.8.199:9445" -ForegroundColor Cyan
Write-Host "Backend Dev:  https://192.168.8.199:9446" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cloudflare Routes:" -ForegroundColor Yellow
Write-Host "  dev.mail.oathone.com -> https://192.168.8.199:9445" -ForegroundColor White
Write-Host "  dev.mailbackend.oathone.com -> https://192.168.8.199:9446" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

