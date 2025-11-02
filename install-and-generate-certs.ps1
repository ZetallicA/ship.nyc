# Script to install mkcert and generate SSL certificates
$ErrorActionPreference = "Stop"

Write-Host "InterShip SSL Certificate Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if mkcert is installed
if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "mkcert is not installed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Cyan
    Write-Host "1. Using Chocolatey (requires admin):" -ForegroundColor White
    Write-Host "   choco install mkcert" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Using Scoop:" -ForegroundColor White
    Write-Host "   scoop install mkcert" -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Manual download:" -ForegroundColor White
    Write-Host "   Visit: https://github.com/FiloSottile/mkcert/releases" -ForegroundColor Green
    Write-Host "   Download mkcert-v*-windows-amd64.exe and rename to mkcert.exe" -ForegroundColor Green
    Write-Host "   Place in a folder in your PATH" -ForegroundColor Green
    Write-Host ""
    
    $install = Read-Host "Would you like to try installing via Chocolatey now? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Host "Installing mkcert via Chocolatey..." -ForegroundColor Cyan
            choco install mkcert -y
            if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
                Write-Host "Installation may require restarting PowerShell or refreshing PATH" -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "Chocolatey not found. Please install mkcert manually." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please install mkcert manually and run this script again." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "mkcert is installed!" -ForegroundColor Green
Write-Host ""

# Create certs directory
$certsDir = ".\certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
    Write-Host "Created certs directory" -ForegroundColor Green
}

# Install CA
Write-Host "Installing mkcert certificate authority..." -ForegroundColor Cyan
mkcert -install
Write-Host ""

# Generate certificates
Write-Host "Generating SSL certificates for:" -ForegroundColor Cyan
Write-Host "  - localhost" -ForegroundColor White
Write-Host "  - 127.0.0.1" -ForegroundColor White
Write-Host "  - 192.168.8.199" -ForegroundColor White
Write-Host "  - 0.0.0.0" -ForegroundColor White
Write-Host ""

Push-Location $certsDir
mkcert localhost 127.0.0.1 192.168.8.199 0.0.0.0
Pop-Location

Write-Host ""
Write-Host "Renaming certificate files..." -ForegroundColor Cyan

# Find and rename certificate files
$certFile = Get-ChildItem "$certsDir\localhost+*.pem" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*key*" } | Select-Object -First 1
$keyFile = Get-ChildItem "$certsDir\localhost+*key*.pem" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($certFile -and $keyFile) {
    Copy-Item $certFile.FullName "$certsDir\localhost.pem" -Force
    Copy-Item $keyFile.FullName "$certsDir\localhost-key.pem" -Force
    Write-Host "  Renamed: $($certFile.Name) -> localhost.pem" -ForegroundColor Green
    Write-Host "  Renamed: $($keyFile.Name) -> localhost-key.pem" -ForegroundColor Green
} else {
    # Try different naming pattern
    $certFile = Get-ChildItem "$certsDir\*.pem" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*key*" } | Select-Object -First 1
    $keyFile = Get-ChildItem "$certsDir\*key*.pem" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($certFile -and $keyFile) {
        Copy-Item $certFile.FullName "$certsDir\localhost.pem" -Force
        Copy-Item $keyFile.FullName "$certsDir\localhost-key.pem" -Force
        Write-Host "  Renamed: $($certFile.Name) -> localhost.pem" -ForegroundColor Green
        Write-Host "  Renamed: $($keyFile.Name) -> localhost-key.pem" -ForegroundColor Green
    } else {
        Write-Host "Could not find certificate files. Please check certs directory." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Certificates generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Certificate files:" -ForegroundColor Cyan
Write-Host "  - certs/localhost.pem" -ForegroundColor White
Write-Host "  - certs/localhost-key.pem" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart the frontend container:" -ForegroundColor White
Write-Host "     docker-compose restart frontend" -ForegroundColor Green
Write-Host ""
Write-Host "  2. Access the application at:" -ForegroundColor White
Write-Host "     https://localhost:8443" -ForegroundColor Green
Write-Host "     or" -ForegroundColor White
Write-Host "     https://192.168.8.199:8443" -ForegroundColor Green
Write-Host ""

