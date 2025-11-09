Write-Host "========================================" -ForegroundColor Cyan
Write-Host "InterShip API Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking API endpoints..." -ForegroundColor Yellow

# Test HTTP endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/users" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ HTTP API (port 5000): WORKING" -ForegroundColor Green
    Write-Host "   Response: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ HTTP API (port 5000): NOT WORKING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test HTTPS endpoint
try {
    $response = Invoke-WebRequest -Uri "https://localhost:7000/api/users" -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck
    Write-Host "✅ HTTPS API (port 7000): WORKING" -ForegroundColor Green
    Write-Host "   Response: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ HTTPS API (port 7000): NOT WORKING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test Swagger endpoint
try {
    $response = Invoke-WebRequest -Uri "https://localhost:7000/swagger" -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck
    Write-Host "✅ Swagger UI: WORKING" -ForegroundColor Green
    Write-Host "   Available at: https://localhost:7000/swagger" -ForegroundColor Gray
} catch {
    Write-Host "❌ Swagger UI: NOT WORKING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Access Links:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Documentation: https://localhost:7000/swagger" -ForegroundColor White
Write-Host "API Endpoints: https://localhost:7000/api/users" -ForegroundColor White
Write-Host "React App: http://localhost:3000 (after setup)" -ForegroundColor White
Write-Host ""

Write-Host "If API is not working, run:" -ForegroundColor Yellow
Write-Host "cd InterShip.Api" -ForegroundColor Gray
Write-Host "dotnet run --urls `"http://localhost:5000;https://localhost:7000`"" -ForegroundColor Gray
Write-Host ""











